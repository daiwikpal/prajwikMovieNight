'use client';

import { useState } from 'react';

interface StreamingSite {
  name: string;
  url: string;
  icon: string;
  color: string;
}

const STREAMING_SITES: StreamingSite[] = [
  { name: 'Netflix', url: 'https://netflix.com', icon: '🎬', color: '#E50914' },
  { name: 'Disney+', url: 'https://disneyplus.com', icon: '🏰', color: '#113CCF' },
  { name: 'Hulu', url: 'https://hulu.com', icon: '📺', color: '#1CE783' },
  { name: 'Prime Video', url: 'https://primevideo.com', icon: '📦', color: '#00A8E1' },
  { name: 'HBO Max', url: 'https://max.com', icon: '🎭', color: '#5822B4' },
  { name: 'YouTube', url: 'https://youtube.com', icon: '▶️', color: '#FF0000' },
  { name: 'Plex', url: 'https://app.plex.tv', icon: '🎞️', color: '#E5A00D' },
  { name: 'FMovies', url: 'https://fmovies.wtf', icon: '🎥', color: '#FFD700' },
  { name: 'Crunchyroll', url: 'https://crunchyroll.com', icon: '🍥', color: '#F47521' },
  { name: 'Tubi', url: 'https://tubitv.com', icon: '📽️', color: '#FA382F' },
];

interface StreamingSidebarProps {
  onNavigate: (url: string) => void;
  currentUrl?: string;
  isConnected: boolean;
}

export default function StreamingSidebar({ onNavigate, currentUrl, isConnected }: StreamingSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        isCollapsed ? 'w-16' : 'w-56'
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
        {STREAMING_SITES.map((site) => {
          const isActive = isCurrentSite(site.url);
          return (
            <button
              key={site.name}
              onClick={() => onNavigate(site.url)}
              disabled={!isConnected}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
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
          );
        })}
      </div>

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
