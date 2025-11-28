'use client';

import { useState, useEffect } from 'react';
import { getStreamingSites, addStreamingSite, deleteStreamingSite } from '@/app/actions/streaming-sites';

interface StreamingSite {
  id: string;
  name: string;
  url: string;
  icon: string;
}

interface StreamingSidebarProps {
  onNavigate: (url: string) => void;
  currentUrl?: string;
  isConnected: boolean;
}

export default function StreamingSidebar({ onNavigate, currentUrl, isConnected }: StreamingSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sites, setSites] = useState<StreamingSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', url: '', icon: '' });
  const [isAdding, setIsAdding] = useState(false);

  // Fetch sites from database
  useEffect(() => {
    getStreamingSites().then((data) => {
      setSites(data);
      setIsLoading(false);
    });
  }, []);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name || !newSite.url || !newSite.icon) return;

    setIsAdding(true);
    try {
      const site = await addStreamingSite(newSite);
      setSites([...sites, site]);
      setNewSite({ name: '', url: '', icon: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding site:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    try {
      await deleteStreamingSite(id);
      setSites(sites.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  const isCurrentSite = (siteUrl: string) => {
    if (!currentUrl) return false;
    try {
      const current = new URL(currentUrl);
      const site = new URL(siteUrl);
      return current.hostname.includes(site.hostname.replace('www.', ''));
    } catch {
      return false;
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#1a1a2e] border-r border-[#2d2d44] transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#2d2d44] flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-pink-400">Streaming Sites</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-[#2d2d44] rounded-lg transition-colors text-gray-400 hover:text-white"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Sites List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full" />
          </div>
        ) : sites.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No sites yet</p>
        ) : (
          sites.map((site) => {
            const isActive = isCurrentSite(site.url);
            return (
              <div key={site.id} className="group relative">
                <button
                  onClick={() => onNavigate(site.url)}
                  disabled={!isConnected}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border border-pink-500/50' 
                      : 'hover:bg-[#2d2d44]'
                    }
                    ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={site.name}
                >
                  <span 
                    className="text-xl flex-shrink-0"
                    style={{ filter: isActive ? 'none' : 'grayscale(0.3)' }}
                  >
                    {site.icon}
                  </span>
                  {!isCollapsed && (
                    <span className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-300 group-hover:text-white'}`}>
                      {site.name}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <span className="ml-auto w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                  )}
                </button>
                {/* Delete button - shows on hover */}
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSite(site.id);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/30 rounded text-red-400 text-xs transition-opacity"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Site Form */}
      {!isCollapsed && (
        <div className="p-2 border-t border-[#2d2d44]">
          {showAddForm ? (
            <form onSubmit={handleAddSite} className="space-y-2">
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={newSite.icon}
                onChange={(e) => setNewSite({ ...newSite, icon: e.target.value })}
                className="w-full px-2 py-1.5 bg-[#0f0f1a] border border-[#2d2d44] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                maxLength={4}
              />
              <input
                type="text"
                placeholder="Name"
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                className="w-full px-2 py-1.5 bg-[#0f0f1a] border border-[#2d2d44] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newSite.url}
                onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                className="w-full px-2 py-1.5 bg-[#0f0f1a] border border-[#2d2d44] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isAdding || !newSite.name || !newSite.url || !newSite.icon}
                  className="flex-1 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-600 rounded text-xs font-medium transition-colors"
                >
                  {isAdding ? '...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSite({ name: '', url: '', icon: '' });
                  }}
                  className="px-3 py-1.5 bg-[#2d2d44] hover:bg-[#3d3d54] rounded text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-[#2d2d44] hover:bg-[#3d3d54] rounded-lg text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>+</span>
              <span>Add Site</span>
            </button>
          )}
        </div>
      )}

      {/* Status */}
      <div className="p-3 border-t border-[#2d2d44]">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
          {!isCollapsed && (
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Not connected'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
