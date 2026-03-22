// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://basketball-tactics-board.onrender.com';

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  SEARCH_PLAYERS: `${API_BASE_URL}/api/players/search`,
  GET_PLAYER_STATS: (playerId: string) => `${API_BASE_URL}/api/players/${playerId}/stats`,

  // Tactics Gallery
  TACTICS: `${API_BASE_URL}/api/tactics`,

  // AI Tactics Search
  AI_TACTICS_SEARCH: `${API_BASE_URL}/api/tactics/ai-search`
};

export default API_BASE_URL;
