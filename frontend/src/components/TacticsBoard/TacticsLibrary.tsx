import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { 
  Drawer, Input, Card, Tag, Button, Typography, 
  Space, Select, Empty, Spin, message, Row, Col, Badge, Tabs, Dropdown, Menu, Tooltip, Modal,
  ConfigProvider, theme
} from 'antd';
import { 
  SearchOutlined, PlayCircleOutlined, DeleteOutlined, EditOutlined, 
  ReadOutlined, YoutubeOutlined, MoreOutlined, ThunderboltOutlined, RobotOutlined,
  SendOutlined
} from '@ant-design/icons';
import { API_ENDPOINTS } from '../../config/api';
import { Tactic } from '../../types';

interface AISearchResult {
  tactic_id: string;
  name: string;
  category: string;
  sub_category?: string;
  description: string;
  tags: string[];
  reason: string;
  preview_image?: string;
}

const AI_LOADING_MESSAGES = [
  '🧠 Analyzing your request...',
  '📋 Scanning tactic database...',
  '🏀 Matching basketball strategies...',
  '🤖 Generating coaching insights...',
  '✨ Preparing recommendations...'
];

const EXAMPLE_PROMPTS = [
  'Pick and roll for fast guards',
  'Defense against tall post players',
  'Spacing offense with perimeter shooting',
  'Motion offense with lots of cutting',
  'Zone defense breaker',
  'Full court press defense'
];

const { Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

interface TacticsLibraryProps {
  visible: boolean;
  onClose: () => void;
  onSelectTactic: (tacticId: string, mode?: 'play' | 'edit') => void;
}

const CATEGORIES = ['All', 'Offense', 'Defense', 'Strategy & Concepts'];

const CATEGORY_TOOLTIPS: Record<string, string> = {
  'Offense': 'Strategies to score points (e.g., Motion, Set)',
  'Defense': 'Strategies to stop opponents (e.g., Man, Zone)',
  'Strategy & Concepts': 'General game plans, philosophies, and learning modules',
  'All': 'View all tactics'
};

const SUB_CATEGORY_TOOLTIPS: Record<string, string> = {
  'Actions': 'Basic building blocks (Pick & Roll, cuts)',
  'Motion': 'Read & React offense (Fluid, 4-Out, 5-Out)',
  'Set': 'Fixed plays for specific shots (Horns, Quick hitters)',
  'Continuity': 'Repeating structured patterns (Flex, Princeton)',
  'Zone': 'Offense designed to beat Zone Defense / Defense guarding areas',
  'Man': 'Man-to-Man defense assignments',
  'Press': 'High-pressure full/half court defense',
  'General Strategy': 'Overarching game plans',
  'Concept': 'Theoretical ideas and principles',
  'Lineup': 'Player combinations'
};

const TacticsLibrary: React.FC<TacticsLibraryProps> = ({ visible, onClose, onSelectTactic }) => {
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [topTab, setTopTab] = useState<string>('gallery');

  // AI Search State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<AISearchResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoadingMsg, setAiLoadingMsg] = useState(AI_LOADING_MESSAGES[0]);
  const aiLoadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState<{ visible: boolean, url: string, title: string }>({ 
      visible: false, url: '', title: '' 
  });

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };
  
  // Extract all available sub-categories from current category
  const availableSubCategories = useMemo(() => {
      if (selectedCategory === 'All') return [];
      const subs = new Set<string>();
      tactics.filter(t => t.category === selectedCategory).forEach(t => {
          if (t.sub_category) subs.add(t.sub_category);
      });
      return Array.from(subs).sort();
  }, [tactics, selectedCategory]);

  useEffect(() => {
    if (visible) {
      fetchTactics();
    }
  }, [visible]);

  const fetchTactics = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TACTICS);
      if (!response.ok) throw new Error('Failed to fetch tactics');
      const data = await response.json();
      setTactics(data);
    } catch (error) {
      console.error('Error fetching tactics:', error);
      message.error('Failed to load tactics library');
    } finally {
      setLoading(false);
    }
  };

  // --- AI Search ---
  const handleAISearch = useCallback(async (queryOverride?: string) => {
    const q = (queryOverride ?? aiQuery).trim();
    if (!q) {
      message.warning('Please describe the tactic you\'re looking for');
      return;
    }
    setAiLoading(true);
    setAiResults([]);
    setAiMessage(null);

    // Start rotating loading messages
    let msgIdx = 0;
    setAiLoadingMsg(AI_LOADING_MESSAGES[0]);
    aiLoadingIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % AI_LOADING_MESSAGES.length;
      setAiLoadingMsg(AI_LOADING_MESSAGES[msgIdx]);
    }, 1500);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(API_ENDPOINTS.AI_TACTICS_SEARCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'AI search failed');
      }

      const data = await response.json();
      setAiResults(data.results || []);
      setAiMessage(data.message || null);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        message.error('AI search timed out. Please try again.');
      } else {
        message.error(error.message || 'AI search failed');
      }
    } finally {
      setAiLoading(false);
      if (aiLoadingIntervalRef.current) {
        clearInterval(aiLoadingIntervalRef.current);
        aiLoadingIntervalRef.current = null;
      }
    }
  }, [aiQuery]);

  const getScoreLabel = (score: number) => {
    if (score >= 85) return { text: 'Excellent Match', color: '#52c41a' };
    if (score >= 70) return { text: 'Good Match', color: '#73d13d' };
    if (score >= 50) return { text: 'Partial Match', color: '#faad14' };
    return { text: 'Possible Match', color: '#ff7a45' };
  };

  const handleDelete = async (tacticId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_ENDPOINTS.TACTICS}/${tacticId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete tactic');
      message.success('Tactic deleted');
      fetchTactics();
    } catch (error) {
      message.error('Failed to delete tactic');
    }
  };

  const filteredTactics = useMemo(() => {
    return tactics.filter(tactic => {
      const matchesSearch = tactic.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          tactic.description.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || tactic.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'All' || tactic.sub_category === selectedSubCategory;
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.every(tag => tactic.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags && matchesSubCategory;
    });
  }, [tactics, searchText, selectedCategory, selectedTags, selectedSubCategory]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tactics.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tactics]);

  const renderTacticCard = (tactic: Tactic) => {
    // Menu for Edit/Delete actions
    const menu = (
        <Menu onClick={(e) => { e.domEvent.stopPropagation(); }}>
            <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => { onSelectTactic(tactic.id, 'edit'); onClose(); }}>
                Edit Tactic
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={(e) => handleDelete(tactic.id, e as any)}>
                Delete
            </Menu.Item>
        </Menu>
    );

    return (
    <Card
      hoverable
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '12px', border: '1px solid #3F3F46', background: '#18181B' }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    >
        {/* 1. Image Area (16:9 Aspect Ratio approx) */}
        <div style={{ position: 'relative', height: 140, backgroundColor: '#1E1E1E', overflow: 'hidden' }}>
            {tactic.preview_image ? (
                <img src={tactic.preview_image} alt={tactic.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525B', flexDirection: 'column' }}>
                    <PlayCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                    <span style={{ fontSize: 12 }}>No Preview</span>
                </div>
            )}
            
            {/* Category Badge (Top Right) */}
            <div style={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                background: 'rgba(0,0,0,0.7)', 
                color: '#F4F4F5', 
                padding: '2px 8px', 
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                backdropFilter: 'blur(4px)'
            }}>
                {tactic.category.toUpperCase()}
            </div>

             {/* Admin Menu (Top Left) */}
             <div style={{ position: 'absolute', top: 8, left: 8 }} onClick={e => e.stopPropagation()}>
                <Dropdown overlay={menu} trigger={['click']}>
                    <Button 
                        size="small" 
                        shape="circle" 
                        icon={<MoreOutlined />} 
                        style={{ border: 'none', background: 'rgba(39,39,42,0.8)', color: '#F4F4F5' }}
                    />
                </Dropdown>
            </div>
        </div>

        {/* 2. Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            {/* Top: Information Zone (Trigger for Hover) */}
            <div className="card-info-zone" style={{ padding: '12px 16px', flex: 1, position: 'relative' }}>
                
                {/* Default Visible Content */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Sub-Category */}
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#A1A1AA', letterSpacing: '1.5px', marginBottom: 2, fontWeight: 700 }}>
                        {tactic.sub_category || 'GENERAL'}
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#F4F4F5', marginBottom: 6, lineHeight: 1.2 }}>
                        <Text style={{ color: '#F4F4F5' }} ellipsis={{ tooltip: tactic.name }}>{tactic.name}</Text>
                    </div>

                    {/* Short Description (Trigger for Hover) */}
                    <div className="description-trigger-zone" style={{ marginBottom: 12, height: 38, position: 'static' }}>
                        <div style={{ height: '100%', overflow: 'hidden' }}>
                            <Paragraph 
                                ellipsis={{ rows: 2 }} 
                                style={{ fontSize: 13, lineHeight: 1.4, margin: 0, color: '#A1A1AA' }}
                            >
                                {tactic.description || 'No description provided.'}
                            </Paragraph>
                        </div>

                         {/* Hover Overlay (Premium Popover with Actions) */}
                        <div className="hover-overlay" style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            background: 'rgba(39, 39, 42, 0.98)', 
                            padding: '12px 16px 8px 16px', // Tight bottom padding (8px)
                            zIndex: 100,
                            display: 'flex', 
                            flexDirection: 'column',
                            borderRadius: 0, 
                            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        }}>

                            {/* Scrollable Description with Custom Scrollbar */}
                            <div className="custom-scrollbar" style={{ 
                                fontSize: 13, 
                                color: '#D4D4D8', 
                                lineHeight: 1.5, 
                                overflowY: 'auto', 
                                // flex: 1,  <-- Removed to eliminate blank space between text and buttons
                                marginBottom: 0,
                                paddingRight: 4,
                                position: 'relative'
                            }}>
                                 {tactic.description || 'No description provided.'}
                            </div>

                            {/* Internal Actions (Links) */}
                            {(tactic.external_links?.article || tactic.external_links?.video) && (
                                <div style={{ 
                                    marginTop: 8,
                                    paddingTop: 8,
                                    borderTop: '1px solid #3F3F46', 
                                    display: 'flex',
                                    gap: 8
                                }}>
                                     {tactic.external_links?.article && (
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewModal({
                                                    visible: true,
                                                    url: tactic.external_links.article!,
                                                    title: 'Source Article'
                                                });
                                            }}
                                            style={{ 
                                                flex: 1, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                fontSize: 12,
                                                background: 'transparent',
                                                color: '#A1A1AA',
                                                padding: '6px 8px',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: 500,
                                                userSelect: 'none'
                                            }}
                                            className="overlay-link article-link"
                                        >
                                           <ReadOutlined style={{ marginRight: 6 }} /> Source
                                        </div>
                                    )}
                                    {tactic.external_links?.video && (
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewModal({
                                                    visible: true,
                                                    url: tactic.external_links.video!,
                                                    title: 'Training Video'
                                                });
                                            }}
                                            style={{ 
                                                flex: 1, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                fontSize: 12,
                                                background: 'transparent',
                                                color: '#A1A1AA',
                                                padding: '6px 8px',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: 500,
                                                userSelect: 'none'
                                            }}
                                            className="overlay-link video-link"
                                        >
                                           <YoutubeOutlined style={{ marginRight: 6 }} /> Video
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags (Horizontal Scroll with Slim Bar) */}
                    <div className="custom-horizontal-scrollbar" style={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        flexWrap: 'nowrap',
                        alignItems: 'center', 
                        gap: 6, 
                        marginBottom: 'auto',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        paddingBottom: 4
                    }}>
                        {tactic.tags && tactic.tags.map(tag => (
                            <span key={tag} style={{ 
                                flexShrink: 0,
                                background: '#3F3F46', 
                                color: '#F4F4F5', 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                fontSize: '10px'
                            }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

             {/* 3. Footer Bar (Single Full-Width Action) */}
             <div style={{ 
                 padding: '12px 16px',
                 paddingTop: 0,
                 marginTop: 'auto',
                 display: 'flex', 
                 alignItems: 'center',
                 justifyContent: 'center'
             }}>
                 <Button 
                    type="default" 
                    block
                    size="middle"
                    className="load-tactic-btn"
                    icon={<PlayCircleOutlined />} 
                    onClick={() => {
                        onSelectTactic(tactic.id, 'play');
                        onClose();
                    }}
                    style={{ 
                        fontWeight: 600, 
                        height: 36,
                        borderRadius: 6,
                        borderColor: '#F59E0B',
                        color: '#F59E0B',
                        background: 'transparent'
                    }}
                 >
                    LOAD TACTIC
                 </Button>
             </div>
        </div>
        <style>{`
            /* Premium Overlay Logic */
            .description-trigger-zone .hover-overlay { 
                opacity: 0; 
                transform: translateY(8px) scale(0.98); 
                pointer-events: none; 
                visibility: hidden;
            }
            .description-trigger-zone:hover .hover-overlay { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
                pointer-events: auto; 
                visibility: visible;
                transition-delay: 0.1s;
            }

            /* Custom Slim Invisible Scrollbar */
            .custom-scrollbar::-webkit-scrollbar {
                width: 0px;
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: transparent;
                border: none;
            }
            .custom-scrollbar {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }

            /* Horizontal Scroll No Bar (Hidden) */
            .custom-horizontal-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .custom-horizontal-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            /* Ghost Button Hovers */
            .article-link:hover {
                background: #3F3F46 !important; /* Zinc-700 */
                color: #F4F4F5 !important; 
            }
            .video-link:hover {
                background: #3F3F46 !important; 
                color: #F4F4F5 !important; 
            }
            .load-tactic-btn:hover {
                background: #F59E0B !important;
                color: #18181B !important;
                border-color: #F59E0B !important;
            }
        `}</style>
    </Card>
  );
  };

  // --- AI Result Card ---
  const renderAIResultCard = (result: AISearchResult, index: number) => {
    return (
      <Card
        hoverable
        style={{ width: '100%', borderRadius: 12, border: '1px solid #3F3F46', overflow: 'hidden', background: '#18181B' }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Thumbnail: show preview_image if available, otherwise abstract SVG court */}
        <div style={{
          position: 'relative', height: 120,
          background: 'linear-gradient(135deg, #18181B, #27272A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {result.preview_image ? (
            <img src={result.preview_image} alt={result.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            /* Minimal SVG court sketch (fallback) */
            <svg width="120" height="70" viewBox="0 0 120 70" style={{ opacity: 0.25 }}>
              <rect x="5" y="5" width="110" height="60" rx="2" fill="none" stroke="#A1A1AA" strokeWidth="1" />
              <circle cx="60" cy="35" r="12" fill="none" stroke="#A1A1AA" strokeWidth="0.8" />
              <line x1="60" y1="5" x2="60" y2="65" stroke="#A1A1AA" strokeWidth="0.8" />
              <rect x="5" y="15" width="20" height="40" rx="1" fill="none" stroke="#A1A1AA" strokeWidth="0.8" />
              <rect x="95" y="15" width="20" height="40" rx="1" fill="none" stroke="#A1A1AA" strokeWidth="0.8" />
            </svg>
          )}
          {/* Rank indicator */}
          <div style={{
            position: 'absolute', top: 8, left: 8,
            width: 24, height: 24, borderRadius: '50%',
            background: index === 0 ? '#F59E0B' : '#3F3F46',
            color: '#18181B', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {index + 1}
          </div>
          {/* Category tag */}
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.7)', color: '#F4F4F5',
            padding: '2px 8px', borderRadius: 4,
            fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5
          }}>
            {result.category.toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#A1A1AA', letterSpacing: 1.5, marginBottom: 2, fontWeight: 700 }}>
            {result.sub_category || 'GENERAL'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#F4F4F5', marginBottom: 8, lineHeight: 1.3 }}>
            {result.name}
          </div>

          {/* Query-Aligned AI Explanation */}
          <div style={{
            background: '#27272A',
            border: '1px solid #3F3F46',
            borderRadius: 6, padding: '8px 12px', marginBottom: 10,
            fontSize: 12, color: '#D4D4D8', lineHeight: 1.5,
            borderLeft: '3px solid #3B82F6'
          }}>
            <RobotOutlined style={{ marginRight: 6, color: '#3B82F6' }} />
            {result.reason}
          </div>

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {result.tags.map(tag => (
                <span key={tag} style={{
                  background: '#3F3F46', color: '#F4F4F5',
                  padding: '1px 8px', borderRadius: 6, fontSize: 10
                }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Single Action Button */}
          <Button
            type="default" block size="middle"
            className="load-tactic-btn"
            icon={<EditOutlined />}
            onClick={() => { onSelectTactic(result.tactic_id, 'edit'); onClose(); }}
            style={{ fontWeight: 600, height: 36, borderRadius: 6, borderColor: '#F59E0B', color: '#F59E0B', background: 'transparent' }}
          >
            Load to Canvas
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#F59E0B', // Primary Accent (Amber-500)
          colorInfo: '#3B82F6', // Secondary Accent (Blue-500)
          colorBgBase: '#18181B', // Main Background (Zinc-900)
          colorBgContainer: '#18181B',
          colorBgElevated: '#27272A', // Panel Background (Zinc-800)
          colorTextBase: '#F4F4F5', // Text Primary
          colorTextSecondary: '#A1A1AA', // Text Secondary
          colorBorder: '#3F3F46', // Borders
          colorBorderSecondary: '#3F3F46',
          borderRadius: 6,
          fontFamily: 'Inter, Roboto, sans-serif'
        },
        components: {
          Drawer: {
            colorBgElevated: '#27272A',
          },
          Card: {
            colorBgContainer: '#18181B',
            colorBorderSecondary: '#3F3F46'
          }
        }
      }}
    >
    <Drawer
      title={
          <Space>
              <Typography.Title level={4} style={{ margin: 0, color: '#F4F4F5' }}>Tactics Gallery</Typography.Title>
              <Badge count={filteredTactics.length} style={{ backgroundColor: '#F59E0B', color: '#18181B' }} showZero />
          </Space>
      }
      placement="right"
      onClose={onClose}
      visible={visible}
      width={900}
      headerStyle={{ backgroundColor: '#27272A', borderBottom: '1px solid #3F3F46' }}
      bodyStyle={{ padding: '0 24px 24px', backgroundColor: '#27272A' }}
    >
      {/* Top-level tabs: Gallery | AI Search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#27272A', paddingTop: 8 }}>
        <Tabs activeKey={topTab} onChange={setTopTab} type="card" style={{ marginBottom: 0 }}>
          <TabPane tab={<span><SearchOutlined style={{ marginRight: 4 }} />Gallery</span>} key="gallery" />
          <TabPane tab={<span><ThunderboltOutlined style={{ marginRight: 4, color: '#3B82F6' }} />AI Search</span>} key="ai" />
        </Tabs>
      </div>

      {/* Tab: Gallery (existing) */}
      {topTab === 'gallery' && (
        <>
        <div style={{ position: 'sticky', top: 44, zIndex: 1, background: '#27272A', padding: '8px 0 16px' }}>
            <Card size="small" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)', backgroundColor: '#18181B' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={12}>
                        <Search
                            placeholder="Search by name or description..."
                            allowClear
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: '100%' }}
                            prefix={<SearchOutlined style={{ color: '#A1A1AA' }} />}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Filter by tags"
                            allowClear
                            onChange={setSelectedTags}
                            value={selectedTags}
                            options={allTags.map(tag => ({ label: tag, value: tag }))}
                        />
                    </Col>
                    <Col span={24}>
                         <Space direction="vertical" style={{ width: '100%' }}>
                            <Tabs activeKey={selectedCategory} onChange={(val) => {
                                setSelectedCategory(val);
                                setSelectedSubCategory('All');
                            }} type="card" size="small">
                                {CATEGORIES.map(cat => (
                                    <TabPane 
                                        tab={
                                            <Tooltip title={CATEGORY_TOOLTIPS[cat]} placement="bottom">
                                                <span>{cat}</span>
                                            </Tooltip>
                                        } 
                                        key={cat} 
                                    />
                                ))}
                            </Tabs>
                            
                            {availableSubCategories.length > 0 && (
                                <Select 
                                    style={{ width: 200 }} 
                                    value={selectedSubCategory}
                                    onChange={setSelectedSubCategory}
                                    placeholder="Sub-Category"
                                    optionLabelProp="label"
                                >
                                    <Select.Option value="All" label="All Types">All Types</Select.Option>
                                    {availableSubCategories.map(sub => (
                                        <Select.Option key={sub} value={sub} label={sub}>
                                            <Tooltip title={SUB_CATEGORY_TOOLTIPS[sub] || sub} placement="right">
                                                <div style={{ width: '100%' }}>{sub}</div>
                                            </Tooltip>
                                        </Select.Option>
                                    ))}
                                </Select>
                            )}
                         </Space>
                    </Col>
                </Row>
            </Card>
        </div>

        {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading Gallery..." />
            </div>
        ) : (
             <div style={{ marginTop: 24 }}>
                {filteredTactics.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {filteredTactics.map(tactic => (
                            <Col xs={24} sm={12} md={8} lg={8} xl={6} key={tactic.id}>
                                {renderTacticCard(tactic)}
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span>
                                    No tactics found matching <br/>
                                    <strong>{searchText}</strong> {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''}
                                </span>
                            }
                        />
                        <Button onClick={() => {
                            setSearchText('');
                            setSelectedCategory('All');
                            setSelectedTags([]);
                        }}>
                            Clear Filters
                        </Button>
                    </div>
                )}
             </div>
        )}
        </>
      )}

      {/* Tab: AI Search */}
      {topTab === 'ai' && (
        <div style={{ marginTop: 16 }}>
          {/* Search Input Area */}
          <Card
            bordered={false}
            style={{
              boxShadow: '0 2px 12px rgba(114, 46, 209, 0.08)',
              border: '1px solid #f0e6ff',
              borderRadius: 12,
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <RobotOutlined style={{ fontSize: 20, color: '#722ed1' }} />
              <Typography.Text strong style={{ fontSize: 15 }}>AI Tactic Finder</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Describe what you need in natural language</Typography.Text>
            </div>
            <Input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder={'Describe what you need, e.g. "pick and roll for quick guards"'}
              style={{ borderRadius: 20, fontSize: 14, height: 40 }}
              prefix={<SearchOutlined style={{ color: '#bfbfbf', marginRight: 4 }} />}
              suffix={
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={() => handleAISearch()}
                  loading={aiLoading}
                  style={{ color: '#722ed1' }}
                />
              }
              onPressEnter={() => handleAISearch()}
              disabled={aiLoading}
              allowClear
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {EXAMPLE_PROMPTS.slice(0, 4).map(prompt => (
                  <Tag
                    key={prompt}
                    style={{ cursor: 'pointer', borderRadius: 12, fontSize: 11 }}
                    color="purple"
                    onClick={() => { setAiQuery(prompt); handleAISearch(prompt); }}
                  >
                    {prompt}
                  </Tag>
                ))}
            </div>

          </Card>

          {/* Loading State */}
          {aiLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <div style={{
                marginTop: 16, fontSize: 14, color: '#722ed1',
                fontWeight: 500, transition: 'all 0.3s'
              }}>
                {aiLoadingMsg}
              </div>
            </div>
          )}

          {/* Results */}
          {!aiLoading && aiResults.length > 0 && (
            <div>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Found {aiResults.length} recommendation{aiResults.length > 1 ? 's' : ''}
              </Typography.Text>
              <Row gutter={[16, 16]}>
                {aiResults.map((result, index) => (
                  <Col xs={24} sm={12} md={8} key={result.tactic_id}>
                    {renderAIResultCard(result, index)}
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* No Results */}
          {!aiLoading && aiResults.length === 0 && aiMessage && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#8c8c8c' }}>{aiMessage}</span>
                }
              />
            </div>
          )}

          {/* Initial State */}
          {!aiLoading && aiResults.length === 0 && !aiMessage && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#bfbfbf' }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
              <div style={{ fontSize: 14 }}>Describe what you're looking for and let AI find the best tactics for you</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Supports English and Chinese 🌏</div>
            </div>
          )}
        </div>
      )}

        {/* Content Preview Modal */}
        <Modal
            title={previewModal.title}
            open={previewModal.visible}
            onCancel={() => setPreviewModal(prev => ({ ...prev, visible: false }))}
            footer={null}
            width={900}
            centered
            destroyOnClose
            bodyStyle={{ 
                padding: 0, 
                overflow: 'hidden', 
                height: '65vh',
                background: (previewModal.url.includes('youtube') || previewModal.url.includes('youtu.be')) ? '#000' : '#fff'
            }}
        >
             <iframe
                src={getEmbedUrl(previewModal.url)}
                title={previewModal.title}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 0
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </Modal>

    </Drawer>
    </ConfigProvider>
  );
};

export default TacticsLibrary;

