'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StreamingSidebar from './StreamingSidebar';
import SessionManager from './SessionManager';
import ShareModal from './ShareModal';

interface HyperbeamSession {
  session_id: string;
  embed_url: string;
  admin_token: string;
}

interface ConnectionState {
  state: 'idle' | 'connecting' | 'playing' | 'reconnecting' | 'error';
  message?: string;
}

export default function HyperbeamEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hyperbeamClientRef = useRef<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<HyperbeamSession | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({ state: 'idle' });
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [hyperbeamClient, setHyperbeamClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);

  const getShareableUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const disconnectSession = async () => {
    if (!session) return;

    try {
      // Destroy the hyperbeam client first using ref
      if (hyperbeamClientRef.current) {
        hyperbeamClientRef.current.destroy();
        hyperbeamClientRef.current = null;
        setHyperbeamClient(null);
      }
      
      // Clear the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      // Try to terminate the session on the server if we have a valid session_id
      if (session.session_id && session.session_id !== 'shared') {
        await fetch(`/api/session/${session.session_id}`, {
          method: 'DELETE',
        }).catch(err => console.error('Failed to terminate session:', err));
      }

      // Clear local state
      localStorage.removeItem('hyperbeam_session');
      setSession(null);
      setHyperbeamClient(null);
      setConnectionState({ state: 'idle' });
      setIsJoiningSession(false);
      setIsLoading(false);
      setCurrentUrl('');
      
      // Remove URL param
      router.push('/', { scroll: false });
    } catch (error) {
      console.error('Error disconnecting session:', error);
    }
  };

  const createNewSession = () => {
    // Destroy existing Hyperbeam instance
    if (hyperbeamClientRef.current) {
      hyperbeamClientRef.current.destroy();
      hyperbeamClientRef.current = null;
    }
    
    // Clear existing session
    localStorage.removeItem('hyperbeam_session');
    setSession(null);
    setHyperbeamClient(null);
    setConnectionState({ state: 'idle' });
    // Remove URL param
    router.push('/', { scroll: false });
  };

  const resetAll = () => {
    // Destroy existing Hyperbeam instance
    if (hyperbeamClientRef.current) {
      try {
        hyperbeamClientRef.current.destroy();
      } catch (err) {
        console.warn('Error destroying instance:', err);
      }
      hyperbeamClientRef.current = null;
    }
    
    // Clear container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // Reset all state
    localStorage.removeItem('hyperbeam_session');
    setSession(null);
    setHyperbeamClient(null);
    setConnectionState({ state: 'idle' });
    setIsJoiningSession(false);
    setIsLoading(false);
    setCurrentUrl('');
    setUrlInput('');
    setShowShareModal(false);
    setShowSessionManager(false);
    
    // Remove URL params and go to home
    router.push('/', { scroll: false });
  };

  // Load session from localStorage or URL
  useEffect(() => {
    const embedUrl = searchParams.get('session');
    
    if (embedUrl) {
      // Join existing session from URL
      setIsJoiningSession(true);
      setConnectionState({ state: 'connecting', message: 'Joining existing session...' });
      
      // Decode the embed URL from the URL parameter
      try {
        const decodedUrl = decodeURIComponent(embedUrl);
        setSession({
          session_id: 'shared',
          embed_url: decodedUrl,
          admin_token: '', // Non-admin users won't have admin token
        });
      } catch (error) {
        console.error('Error decoding session URL:', error);
        setConnectionState({ state: 'error', message: 'Invalid session URL' });
        setIsJoiningSession(false);
      }
    } else {
      // Check localStorage for existing session
      const storedSession = localStorage.getItem('hyperbeam_session');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          // Check if session is recent (within last hour)
          const sessionTime = parsed.timestamp || 0;
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          
          if (now - sessionTime < oneHour) {
            setSession(parsed.session);
            setConnectionState({ state: 'connecting', message: 'Restoring previous session...' });
          } else {
            // Session expired, clear it
            localStorage.removeItem('hyperbeam_session');
          }
        } catch (error) {
          console.error('Error loading stored session:', error);
          localStorage.removeItem('hyperbeam_session');
        }
      }
    }
  }, [searchParams]);

  const createSession = async () => {
    setIsLoading(true);
    setConnectionState({ state: 'connecting', message: 'Creating new session...' });
    
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const data = await response.json();
      setSession(data);
      
      // Store session in localStorage
      localStorage.setItem('hyperbeam_session', JSON.stringify({
        session: data,
        timestamp: Date.now(),
      }));
      
      // Update URL with session parameter (for easy sharing)
      const encodedUrl = encodeURIComponent(data.embed_url);
      router.push(`?session=${encodedUrl}`, { scroll: false });
      
      setConnectionState({ state: 'connecting', message: 'Session created, loading...' });
    } catch (error) {
      console.error('Error creating session:', error);
      setConnectionState({ 
        state: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create session' 
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session || !containerRef.current) return;

    let mounted = true;
    let hbInstance: any = null;

    const loadHyperbeam = async () => {
      // Small delay to ensure DOM is ready (helps with StrictMode double-execution)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!mounted || !containerRef.current) return;

      try {
        // Destroy any existing instance BEFORE creating a new one
        if (hyperbeamClientRef.current) {
          console.log('Destroying existing Hyperbeam instance...');
          try {
            hyperbeamClientRef.current.destroy();
          } catch (err) {
            console.warn('Error destroying previous instance:', err);
          }
          hyperbeamClientRef.current = null;
          setHyperbeamClient(null);
        }

        // Check again after potential async operations
        if (!mounted || !containerRef.current) return;

        // Dynamically import Hyperbeam
        const Hyperbeam = (await import('@hyperbeam/web')).default;

        if (!mounted || !containerRef.current) return;

        console.log('Creating new Hyperbeam instance...');
        hbInstance = await Hyperbeam(containerRef.current, session.embed_url, {
          adminToken: session.admin_token,
          volume: 1.0,
          delegateKeyboard: true,
          onConnectionStateChange: ({ state }) => {
            setConnectionState({ state: state as any });
          },
          onDisconnect: ({ type }) => {
            setConnectionState({ 
              state: 'error', 
              message: `Disconnected: ${type}` 
            });
          },
        });

        if (mounted) {
          hyperbeamClientRef.current = hbInstance;
          setHyperbeamClient(hbInstance);
          setConnectionState({ state: 'playing' });
          setIsLoading(false);

          // Listen to tab updates
          hbInstance.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
            if (changeInfo.url) {
              setCurrentUrl(changeInfo.url);
            }
          });
        } else {
          // Component unmounted during async operation, clean up
          hbInstance.destroy();
        }
      } catch (error) {
        console.error('Error loading Hyperbeam:', error);
        if (mounted) {
          setConnectionState({ 
            state: 'error', 
            message: error instanceof Error ? error.message : 'Failed to load embed' 
          });
          setIsLoading(false);
        }
      }
    };

    loadHyperbeam();

    return () => {
      mounted = false;
      // Use ref for cleanup - always has the latest instance
      if (hyperbeamClientRef.current) {
        console.log('Cleanup: destroying Hyperbeam instance');
        try {
          hyperbeamClientRef.current.destroy();
        } catch (err) {
          console.warn('Error during cleanup:', err);
        }
        hyperbeamClientRef.current = null;
      }
      // Clear container on cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [session]);

  const navigateToUrl = (url?: string) => {
    const targetUrl = url || urlInput;
    if (hyperbeamClient && targetUrl) {
      hyperbeamClient.tabs.update({ url: targetUrl });
      if (url) setUrlInput(url);
    }
  };

  const getStatusColor = () => {
    switch (connectionState.state) {
      case 'playing': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isConnected = connectionState.state === 'playing';

  return (
    <div className="flex flex-col h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="h-14 bg-[#1a1a2e] border-b border-[#2d2d44] flex items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">💕</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Prajwiks Movie Night
          </h1>
        </div>

        {/* URL Input - only show when connected */}
        {session && hyperbeamClient && (
          <div className="flex-1 flex items-center gap-2 max-w-2xl">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigateToUrl()}
              placeholder="Enter URL to watch..."
              className="flex-1 px-3 py-1.5 bg-[#0f0f1a] border border-[#2d2d44] rounded-lg text-sm focus:outline-none focus:border-pink-500 transition-colors"
            />
            <button
              onClick={() => navigateToUrl()}
              className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all"
            >
              Go
            </button>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-2 ml-auto">
          {session && (
            <>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-gray-400 hidden sm:inline">
                {isJoiningSession ? 'Watching together' : connectionState.state}
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {session && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <span>💕</span>
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={disconnectSession}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 rounded-lg text-sm transition-colors"
                title="Disconnect"
              >
                ✕
              </button>
            </>
          )}
          <button
            onClick={() => setShowSessionManager(!showSessionManager)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showSessionManager 
                ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300' 
                : 'bg-[#2d2d44] hover:bg-[#3d3d54] text-gray-300'
            }`}
            title="Session Manager"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Streaming Sites */}
        <StreamingSidebar
          onNavigate={navigateToUrl}
          currentUrl={currentUrl}
          isConnected={isConnected}
        />

        {/* Center - Hyperbeam Container */}
        <div className="flex-1 relative bg-black">
          {session ? (
            <div
              key={session.session_id}
              ref={containerRef}
              className="absolute inset-0"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 mb-6">
                  <span className="text-5xl">💕</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Start a Watch Session
                </h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Create a shared virtual browser to watch movies together with your partner, no matter the distance.
                </p>
                <button
                  onClick={createSession}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold transition-all shadow-lg shadow-pink-500/20"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Start Watching Together'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Session Manager */}
        {showSessionManager && (
          <SessionManager 
            onClose={() => setShowSessionManager(false)} 
            onDisconnectAll={resetAll}
          />
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={getShareableUrl()}
      />
    </div>
  );
}
