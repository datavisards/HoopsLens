# DigitalOcean 部署指南（Droplet + Nginx + systemd）

本指南用于将项目部署到一台 Ubuntu Droplet：
- 前端：Vite 构建后的静态文件，由 Nginx 提供
- 后端：FastAPI（Uvicorn），由 systemd 守护
- HTTPS：Let's Encrypt 证书

## 0. 前置条件

- 一台 DigitalOcean Droplet（建议 Ubuntu 22.04）
- 一个域名（例如 `tactics.example.com`）并已解析到 Droplet 公网 IP
- 本机可以通过 SSH 连接服务器

## 1. 服务器初始化

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx python3 python3-venv python3-pip nodejs npm certbot python3-certbot-nginx
```

可选（更高 Node 版本）：使用 nvm 安装 Node 20+

## 2. 拉取代码

```bash
cd /var/www
sudo git clone <你的仓库地址> TacticsBoard_Project
sudo chown -R $USER:$USER /var/www/TacticsBoard_Project
cd /var/www/TacticsBoard_Project
```

## 3. 部署后端（FastAPI）

```bash
cd /var/www/TacticsBoard_Project/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

编辑 `.env`，填入真实 API Key。

创建 systemd 服务：

```bash
sudo tee /etc/systemd/system/tactics-backend.service > /dev/null <<'EOF'
[Unit]
Description=Basketball Tactics FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/TacticsBoard_Project/backend
Environment="PATH=/var/www/TacticsBoard_Project/backend/.venv/bin"
ExecStart=/var/www/TacticsBoard_Project/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

授权并启动：

```bash
sudo chown -R www-data:www-data /var/www/TacticsBoard_Project/backend
sudo systemctl daemon-reload
sudo systemctl enable tactics-backend
sudo systemctl start tactics-backend
sudo systemctl status tactics-backend
```

## 4. 构建前端

```bash
cd /var/www/TacticsBoard_Project/frontend
cat > .env.production <<'EOF'
VITE_API_BASE_URL=https://tactics.example.com
EOF
npm ci
npm run build
```

构建产物在 `frontend/dist`。

## 5. 配置 Nginx（静态资源 + API 反向代理）

```bash
sudo tee /etc/nginx/sites-available/tactics-board > /dev/null <<'EOF'
server {
    listen 80;
    server_name tactics.example.com;

    root /var/www/TacticsBoard_Project/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

启用站点并重载：

```bash
sudo ln -sf /etc/nginx/sites-available/tactics-board /etc/nginx/sites-enabled/tactics-board
sudo nginx -t
sudo systemctl reload nginx
```

## 6. 配置 HTTPS（Let's Encrypt）

```bash
sudo certbot --nginx -d tactics.example.com
```

证书自动续期检查：

```bash
sudo systemctl status certbot.timer
```

## 7. 验证部署

```bash
curl -I https://tactics.example.com
curl https://tactics.example.com/health
```

- 访问首页应返回前端页面
- `/health` 应返回后端健康状态 JSON

## 8. 更新发布流程

每次更新代码后执行：

```bash
cd /var/www/TacticsBoard_Project
git pull

# 更新后端（仅依赖变化时）
cd backend
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart tactics-backend

# 更新前端
cd ../frontend
npm ci
npm run build
sudo systemctl reload nginx
```

## 9. 常见问题

- 502 Bad Gateway：
  - `sudo systemctl status tactics-backend`
  - `sudo journalctl -u tactics-backend -n 200 --no-pager`
- 前端请求失败：
  - 检查 `frontend/.env.production` 的 `VITE_API_BASE_URL` 是否为你的域名
  - 检查 Nginx 的 `/api/` 反代配置
- CORS 报错：
  - 当前后端允许所有来源，生产建议改为仅允许你的域名
