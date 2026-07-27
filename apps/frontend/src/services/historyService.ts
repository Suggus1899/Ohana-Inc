export interface HistoryItem {
  id: string;
  address: string;
  lat: number;
  lng: number;
  timestamp: number;
}

const HISTORY_KEY = 'Ohana_search_history';
const MAX_HISTORY_ITEMS = 10;



export const historyService = {
  getHistory: (): string[] => {
    try {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      const items: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];
      return items.map(item => item.address);
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  addSearch: (address: string): void => {
    try {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      const history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];
      
      const filteredHistory = history.filter(item => item.address !== address);

      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        address,
        lat: 0, // Mock lat/lng for simple search history
        lng: 0,
        timestamp: Date.now()
      };

      const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  },

  removeSearch: (address: string): void => {
    try {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      const history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];
      const newHistory = history.filter(item => item.address !== address);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  },

  clearHistory: (): void => {
    localStorage.removeItem(HISTORY_KEY);
  }
};
