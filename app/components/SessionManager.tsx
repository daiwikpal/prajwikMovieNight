'use client';

import { useState, useEffect } from 'react';

interface Session {
  session_id: string;
  created_at?: string;
  [key: string]: any;
}

interface SessionManagerProps {
  onClose: () => void;
  onDisconnectAll?: () => void;
}

export default function SessionManager({ onClose, onDisconnectAll }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to load sessions');
      }
      const data = await response.json();
      console.log('Sessions loaded:', data);
      
      const sessionsList = Array.isArray(data) ? data : [];
      setSessions(sessionsList);
      
      if (sessionsList.length === 0) {
        setMessage('No active sessions found');
      } else {
        setMessage(`Found ${sessionsList.length} active session(s)`);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to load sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectSession = async (sessionId: string) => {
    if (!confirm(`Disconnect session ${sessionId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect session');
      }

      setMessage(`Session ${sessionId} disconnected`);
      // Reload sessions list
      await loadSessions();
    } catch (error) {
      console.error('Error disconnecting session:', error);
      setMessage('Failed to disconnect session');
    }
  };

  const disconnectAll = async () => {
    if (!confirm('Are you sure you want to disconnect ALL active sessions? This will end sessions for all users.')) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect sessions');
      }

      const data = await response.json();
      setMessage(data.message || 'All sessions disconnected');
      setSessions([]);
      
      // Clear local storage
      localStorage.removeItem('hyperbeam_session');
      
      // Notify parent to reset UI
      if (onDisconnectAll) {
        onDisconnectAll();
      }
    } catch (error) {
      console.error('Error disconnecting sessions:', error);
      setMessage('Failed to disconnect sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="w-72 h-full bg-[#1a1a2e] border-l border-[#2d2d44] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-[#2d2d44]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-purple-400">Session Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
        <button
          onClick={loadSessions}
          disabled={isLoading}
          className="w-full px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded-lg text-xs transition-colors"
        >
          {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {message && (
          <div className={`p-2 rounded text-xs ${
            message.includes('Failed') || message.includes('error')
              ? 'bg-red-900/30 text-red-300 border border-red-700'
              : 'bg-purple-900/30 text-purple-300 border border-purple-700'
          }`}>
            {message}
          </div>
        )}

        {sessions.length === 0 && !message && !isLoading && (
          <div className="text-center text-gray-500 py-6">
            <p className="text-sm">No active sessions</p>
            <p className="text-xs mt-1">Click refresh to check</p>
          </div>
        )}

        {sessions.map((session) => (
          <div
            key={session.session_id}
            className="bg-[#0f0f1a] rounded-lg p-2.5 space-y-2 border border-[#2d2d44]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 mb-0.5">Session ID</p>
                <p className="text-xs font-mono text-gray-300 break-all">
                  {session.session_id.slice(0, 12)}...
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" title="Active" />
            </div>
            
            {session.created_at && (
              <p className="text-[10px] text-gray-500">
                {new Date(session.created_at).toLocaleTimeString()}
              </p>
            )}

            <button
              onClick={() => disconnectSession(session.session_id)}
              className="w-full px-2 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 rounded text-xs transition-colors"
            >
              Disconnect
            </button>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-[#2d2d44]">
          <button
            onClick={disconnectAll}
            disabled={isLoading}
            className="w-full px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 rounded-lg text-xs font-medium transition-colors"
          >
            ⚠️ Disconnect All ({sessions.length})
          </button>
        </div>
      )}
    </div>
  );
}
