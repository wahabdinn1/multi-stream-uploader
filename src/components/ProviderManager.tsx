'use client';

import { useState, useEffect } from 'react';
import { Folder, File, Plus, Edit2, Trash2, Upload, Download, Move, RefreshCw, Search, Grid, List, ArrowUp, ArrowDown, Play, Eye, FolderOpen, MoreHorizontal } from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  created?: string;
  parent_id?: string;
  url?: string;
  thumbnail?: string;
  duration?: string;
  views?: number;
}

interface ProviderManagerProps {
  provider: string;
}

export function ProviderManager({ provider }: ProviderManagerProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const [targetFolderId, setTargetFolderId] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: '0', name: 'Root' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeProvider, setActiveProvider] = useState<string>(provider);
  const [showProviderSwitch, setShowProviderSwitch] = useState<boolean>(false);

  const providerConfig = {
    doodstream: {
      name: 'DoodStream',
      icon: '🎬',
      gradient: 'from-purple-500 to-pink-500',
      color: 'purple'
    },
    streamtape: {
      name: 'StreamTape',
      icon: '📼',
      gradient: 'from-purple-500 to-pink-500',
      color: 'purple'
    },
    vidguard: {
      name: 'VidGuard',
      icon: '🛡️',
      gradient: 'from-blue-500 to-cyan-500',
      color: 'blue'
    },
    bigwarp: {
      name: 'BigWarp',
      icon: '🌊',
      gradient: 'from-cyan-500 to-blue-500',
      color: 'cyan'
    }
  };

  const config = providerConfig[activeProvider as keyof typeof providerConfig];

  useEffect(() => {
    loadFolderContents(currentFolder);
  }, [currentFolder, activeProvider]);

  const loadFolderContents = async (folderId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/provider/${activeProvider}/folders?folder_id=${folderId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load folder contents');
      }
      
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/provider/${activeProvider}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parent_id: currentFolder
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create folder');
      }
      
      setNewFolderName('');
      setShowCreateFolder(false);
      await loadFolderContents(currentFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const renameItemAction = async () => {
    if (!renameItem || !newName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = renameItem.type === 'folder' 
        ? `/api/provider/${activeProvider}/folders/${renameItem.id}/rename`
        : `/api/provider/${activeProvider}/files/${renameItem.id}/rename`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename item');
      }

      // Update local state
      if (renameItem.type === 'folder') {
        setFolders(prev => prev.map(folder => 
          folder.id === renameItem.id 
            ? { ...folder, name: newName }
            : folder
        ));
      } else {
        setFiles(prev => prev.map(file => 
          file.id === renameItem.id 
            ? { ...file, name: newName }
            : file
        ));
      }

      setRenameItem(null);
      setNewName('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rename item');
    } finally {
      setLoading(false);
    }
  };

  const moveFileAction = async () => {
    if (!moveItem || !targetFolderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/provider/${activeProvider}/files/${moveItem.id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder_id: targetFolderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move file');
      }

      // Remove file from current view
      setFiles(prev => prev.filter(file => file.id !== moveItem.id));
      
      setMoveItem(null);
      setTargetFolderId('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to move file');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string, type: 'file' | 'folder') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    setLoading(true);
    try {
      const endpoint = type === 'folder' ? 'folders' : 'files';
      const response = await fetch(`/api/provider/${activeProvider}/${endpoint}/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to delete ${type}`);
      }
      
      await loadFolderContents(currentFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    
    // Update breadcrumbs
    if (folderId === '0') {
      setBreadcrumbs([{ id: '0', name: 'Root' }]);
    } else {
      const newBreadcrumbs = [...breadcrumbs];
      const existingIndex = newBreadcrumbs.findIndex(b => b.id === folderId);
      
      if (existingIndex >= 0) {
        // Going back to a previous folder
        setBreadcrumbs(newBreadcrumbs.slice(0, existingIndex + 1));
      } else {
        // Going into a new folder
        newBreadcrumbs.push({ id: folderId, name: folderName });
        setBreadcrumbs(newBreadcrumbs);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredAndSortedItems = () => {
    const allItems = [...folders, ...files];
    
    // Filter by search term
    const filtered = allItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort items
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;
      
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'date':
          const dateA = new Date(a.created || 0).getTime();
          const dateB = new Date(b.created || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) {
      return <Play className="h-6 w-6 text-red-600" />;
    }
    return <File className="h-6 w-6 text-blue-600" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border-4 border-black shadow-brutal p-6 mb-6 transform rotate-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-gradient-to-r ${config.gradient} border-2 border-black shadow-brutal`}>
              <span className="text-2xl">{config.icon}</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-black">{config.name.toUpperCase()} MANAGER! 📁</h1>
              <p className="text-gray-700 font-bold">Manage your folders and files</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProviderSwitch(true)}
              className="px-3 py-2 bg-purple-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
            >
              CHANGE PROVIDER
            </button>
            <button
              onClick={() => loadFolderContents(currentFolder)}
              disabled={loading}
              className="p-3 bg-green-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Breadcrumbs */}
      <div className="bg-white border-3 border-black p-4 mb-4 transform -rotate-1">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <FolderOpen className="h-5 w-5 text-gray-600" />
          <span className="font-black text-gray-600 text-sm">LOCATION:</span>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <button
                onClick={() => navigateToFolder(crumb.id, crumb.name)}
                className={`px-2 py-1 font-bold border-2 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 ${
                  index === breadcrumbs.length - 1 
                    ? 'bg-purple-400 text-black' 
                    : 'bg-gray-200 text-black hover:bg-purple-200'
                }`}
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && (
                <span className="text-gray-500 font-bold">/</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
          <span>📁 {folders.length} folders</span>
          <span>🎬 {files.length} files</span>
          {selectedItems.size > 0 && (
            <span className="text-purple-600">✓ {selectedItems.size} selected</span>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white border-3 border-black p-4 mb-4 transform rotate-1">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border-2 border-black font-bold text-black placeholder:text-gray-500"
            />
          </div>
          
          {/* View Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex border-2 border-black">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 font-black transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-blue-400 text-black' 
                    : 'bg-white text-black hover:bg-blue-100'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 font-black border-l-2 border-black transition-all ${
                  viewMode === 'list' 
                    ? 'bg-blue-400 text-black' 
                    : 'bg-white text-black hover:bg-blue-100'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            {/* Sort Controls */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
              className="p-2 border-2 border-black font-bold text-black"
            >
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="date">Sort by Date</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-200 border-2 border-black font-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowCreateFolder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
        >
          <Plus className="h-4 w-4" />
          NEW FOLDER
        </button>
        
        {selectedItems.size > 0 && (
          <>
            <button
              onClick={() => {
                selectedItems.forEach(id => {
                  const item = [...folders, ...files].find(i => i.id === id);
                  if (item) deleteItem(id, item.type);
                });
                setSelectedItems(new Set());
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
            >
              <Trash2 className="h-4 w-4" />
              DELETE SELECTED ({selectedItems.size})
            </button>
            
            <button
              onClick={() => setSelectedItems(new Set())}
              className="flex items-center gap-2 px-4 py-2 bg-gray-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
            >
              CLEAR SELECTION
            </button>
          </>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-black text-black mb-4">CREATE NEW FOLDER! 📁</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full p-3 border-3 border-black font-bold text-black mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="flex gap-3">
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim() || loading}
                className="flex-1 px-4 py-2 bg-green-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50"
              >
                CREATE
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Provider Modal */}
      {showProviderSwitch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal p-6 max-w-lg w-full mx-4 transform rotate-1">
            <h3 className="text-xl font-black text-black mb-4">SWITCH PROVIDER 🔁</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {Object.entries(providerConfig).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveProvider(key);
                    setCurrentFolder('0');
                    setBreadcrumbs([{ id: '0', name: 'Root' }]);
                    setSelectedItems(new Set());
                    setShowProviderSwitch(false);
                  }}
                  className={`flex items-center gap-3 p-3 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal ${
                    activeProvider === key ? 'bg-yellow-300' : 'bg-white'
                  }`}
                >
                  <span className={`p-2 bg-gradient-to-r ${val.gradient} border-2 border-black shadow-brutal`}>{val.icon}</span>
                  <span className="text-black">{val.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProviderSwitch(false)}
                className="flex-1 px-4 py-2 bg-gray-300 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-3 border-red-500 p-4 mb-4 transform -rotate-1">
          <p className="text-red-800 font-bold">❌ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border-4 border-black shadow-brutal p-8 text-center transform rotate-1">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-black font-black">LOADING...</span>
          </div>
        </div>
      )}

      {/* Content Display */}
      {!loading && (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {filteredAndSortedItems().map((item) => (
            viewMode === 'grid' ? (
              // Grid View
              <div
                key={item.id}
                className={`bg-white border-3 border-black shadow-brutal p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${
                  item.type === 'folder' ? 'cursor-pointer transform rotate-1' : 'transform -rotate-1'
                } ${selectedItems.has(item.id) ? 'ring-4 ring-purple-400' : ''}`}
                onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.name) : null}
              >
                {/* Selection Checkbox */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.type === 'folder' ? (
                      <Folder className="h-6 w-6 text-yellow-600" />
                    ) : (
                      getFileIcon(item.name)
                    )}
                    <span title={item.name} className="font-black text-black truncate flex-1 block min-w-0">{item.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(item.id);
                    }}
                    className="w-4 h-4 border-2 border-black flex-shrink-0"
                  />
                </div>

                {/* File Details */}
                {item.type === 'file' && (
                  <div className="mb-3 space-y-1">
                    {item.size && (
                      <p className="text-gray-600 text-xs font-bold">
                        📦 {formatFileSize(item.size)}
                      </p>
                    )}
                    {item.views && (
                      <p className="text-gray-600 text-xs font-bold">
                        👁️ {item.views.toLocaleString()} views
                      </p>
                    )}
                    {item.duration && (
                      <p className="text-gray-600 text-xs font-bold">
                        ⏱️ {item.duration}
                      </p>
                    )}
                    {item.created && (
                      <p className="text-gray-600 text-xs font-bold">
                        📅 {new Date(item.created).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Thumbnail for videos */}
                {item.type === 'file' && item.thumbnail && (
                  <div className="mb-3">
                    <img 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-full h-32 object-cover border-2 border-black"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {item.type === 'file' && item.url && (
                    <>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-green-400 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        title="Watch/Download"
                      >
                        <Eye className="h-3 w-3" />
                      </a>
                      <a
                        href={item.url}
                        download
                        className="p-1 bg-blue-400 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameItem({ id: item.id, name: item.name, type: item.type });
                    }}
                    className="p-1 bg-yellow-400 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    title="Rename"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  {item.type === 'file' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMoveItem({ id: item.id, name: item.name, type: item.type });
                      }}
                      className="p-1 bg-purple-400 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      title="Move"
                    >
                      <Move className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id, item.type);
                    }}
                    className="p-1 bg-red-400 border-2 border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              // List View
              <div
                key={item.id}
                className={`bg-white border-2 border-black p-3 flex items-center gap-4 hover:bg-gray-50 transition-all ${
                  item.type === 'folder' ? 'cursor-pointer' : ''
                } ${selectedItems.has(item.id) ? 'ring-2 ring-purple-400' : ''}`}
                onClick={() => item.type === 'folder' ? navigateToFolder(item.id, item.name) : null}
              >
                {/* Selection */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleItemSelection(item.id);
                  }}
                  className="w-4 h-4 border-2 border-black"
                />

                {/* Icon */}
                <div className="flex-shrink-0">
                  {item.type === 'folder' ? (
                    <Folder className="h-5 w-5 text-yellow-600" />
                  ) : (
                    getFileIcon(item.name)
                  )}
                </div>

                {/* Thumbnail */}
                {item.type === 'file' && item.thumbnail && (
                  <img 
                    src={item.thumbnail} 
                    alt={item.name}
                    className="w-12 h-8 object-cover border border-black flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span title={item.name} className="font-bold text-black truncate block">{item.name}</span>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                  {item.size && (
                    <span>{formatFileSize(item.size)}</span>
                  )}
                  {item.views && (
                    <span>👁️ {item.views.toLocaleString()}</span>
                  )}
                  {item.created && (
                    <span>{new Date(item.created).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {item.type === 'file' && item.url && (
                    <>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-green-400 border border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        title="Watch"
                      >
                        <Eye className="h-3 w-3" />
                      </a>
                      <a
                        href={item.url}
                        download
                        className="p-1 bg-blue-400 border border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameItem({ id: item.id, name: item.name, type: item.type });
                    }}
                    className="p-1 bg-yellow-400 border border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    title="Rename"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  {item.type === 'file' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMoveItem({ id: item.id, name: item.name, type: item.type });
                      }}
                      className="p-1 bg-purple-400 border border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      title="Move"
                    >
                      <Move className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id, item.type);
                    }}
                    className="p-1 bg-red-400 border border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && folders.length === 0 && files.length === 0 && (
        <div className="bg-white border-4 border-black shadow-brutal p-8 text-center transform -rotate-1">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-black mb-2">EMPTY FOLDER! 📂</h3>
          <p className="text-gray-600 font-bold">No folders or files found</p>
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal p-6 max-w-md w-full mx-4 transform rotate-1">
            <h3 className="text-xl font-black text-black mb-4">
              RENAME {renameItem.type.toUpperCase()} 📝
            </h3>
            <input
              type="text"
              value={newName || renameItem.name}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter new ${renameItem.type} name`}
              className="w-full p-3 border-3 border-black font-bold text-black placeholder-gray-500 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && renameItemAction()}
            />
            <div className="flex gap-3">
              <button
                onClick={renameItemAction}
                disabled={!newName.trim() || loading}
                className="flex-1 px-4 py-2 bg-green-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50"
              >
                RENAME
              </button>
              <button
                onClick={() => {
                  setRenameItem(null);
                  setNewName('');
                }}
                className="flex-1 px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {moveItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal p-6 max-w-md w-full mx-4 transform -rotate-1">
            <h3 className="text-xl font-black text-black mb-4">
              MOVE FILE 📁
            </h3>
            <p className="text-gray-600 font-bold mb-4">
              Moving: {moveItem.name}
            </p>
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="w-full p-3 border-3 border-black font-bold text-black mb-4"
            >
              <option value="">Select destination folder</option>
              <option value="0">Root Folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={moveFileAction}
                disabled={!targetFolderId || loading}
                className="flex-1 px-4 py-2 bg-purple-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50"
              >
                MOVE
              </button>
              <button
                onClick={() => {
                  setMoveItem(null);
                  setTargetFolderId('');
                }}
                className="flex-1 px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
