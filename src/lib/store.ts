import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  results?: Array<{
    provider: string;
    success: boolean;
    url?: string;
    id?: string;
    error?: string;
  }>;
}

export interface HistoryEntry {
  id: string;
  filename: string;
  timestamp: string;
  providers: string[];
  status: 'success' | 'partial' | 'failed';
  results: Array<{
    provider: string;
    success: boolean;
    url?: string;
    id?: string;
    error?: string;
  }>;
}

export interface ProviderStatus {
  [provider: string]: boolean;
}

interface AppState {
  // Upload state
  uploadFiles: UploadFile[];
  selectedProviders: string[];
  isUploading: boolean;
  
  // History
  history: HistoryEntry[];
  
  // Provider status
  providerStatus: ProviderStatus;
  
  // UI settings
  darkMode: boolean;
  
  // Actions
  addUploadFiles: (files: File[]) => void;
  removeUploadFile: (id: string) => void;
  clearUploadFiles: () => void;
  setSelectedProviders: (providers: string[]) => void;
  updateUploadProgress: (id: string, progress: number) => void;
  updateUploadStatus: (id: string, status: UploadFile['status'], results?: UploadFile['results']) => void;
  setIsUploading: (uploading: boolean) => void;
  
  addHistoryEntry: (entry: HistoryEntry) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  
  setProviderStatus: (status: ProviderStatus) => void;
  
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      uploadFiles: [],
      selectedProviders: [],
      isUploading: false,
      history: [],
      providerStatus: {},
      darkMode: false,
      
      // Upload actions
      addUploadFiles: (files: File[]) => {
        const newFiles: UploadFile[] = files.map(file => ({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: 'pending',
          progress: 0,
        }));
        
        set(state => ({
          uploadFiles: [...state.uploadFiles, ...newFiles]
        }));
      },
      
      removeUploadFile: (id: string) => {
        set(state => ({
          uploadFiles: state.uploadFiles.filter(f => f.id !== id)
        }));
      },
      
      clearUploadFiles: () => {
        set({ uploadFiles: [] });
      },
      
      setSelectedProviders: (providers: string[]) => {
        set({ selectedProviders: providers });
      },
      
      updateUploadProgress: (id: string, progress: number) => {
        set(state => ({
          uploadFiles: state.uploadFiles.map(f =>
            f.id === id ? { ...f, progress } : f
          )
        }));
      },
      
      updateUploadStatus: (id: string, status: UploadFile['status'], results?: UploadFile['results']) => {
        set(state => ({
          uploadFiles: state.uploadFiles.map(f =>
            f.id === id ? { ...f, status, results } : f
          )
        }));
      },
      
      setIsUploading: (uploading: boolean) => {
        set({ isUploading: uploading });
      },
      
      // History actions
      addHistoryEntry: (entry: HistoryEntry) => {
        set(state => ({
          history: [entry, ...state.history].slice(0, 100) // Keep last 100 entries
        }));
      },
      
      removeHistoryEntry: (id: string) => {
        set(state => ({
          history: state.history.filter(entry => entry.id !== id)
        }));
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
      
      // Provider actions
      setProviderStatus: (status: ProviderStatus) => {
        set({ providerStatus: status });
      },
      
      // UI actions
      toggleDarkMode: () => {
        set(state => ({ darkMode: !state.darkMode }));
      },
    }),
    {
      name: 'multi-provider-uploader-storage',
      partialize: (state) => ({
        history: state.history,
        selectedProviders: state.selectedProviders,
        darkMode: state.darkMode,
      }),
    }
  )
);
