'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { Trash2, Download, ExternalLink, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function HistoryContent() {
  const { history, clearHistory, removeHistoryEntry } = useAppStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'partial':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'failed':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory();
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal p-8 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-black shadow-brutal">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-black font-black text-xl">NO HISTORY YET! 📁</h3>
            <p className="text-gray-700 font-bold text-sm">Upload files to track them!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Neobrutalism Style */}
      <div className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform -rotate-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 border-2 border-black shadow-brutal">
              📊
            </div>
            <div>
              <h2 className="text-black font-black text-lg">UPLOAD HISTORY!</h2>
              <p className="text-gray-700 font-bold text-sm">Track all activities!</p>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
          >
            🗑️ CLEAR ALL
          </button>
        </div>
      </div>

      {/* History List - Neobrutalism Style */}
      <div className="space-y-4">
        {history.map((entry, index) => (
          <div key={entry.id} className={`bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all transform ${index % 2 === 0 ? 'rotate-0.5' : '-rotate-0.5'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 border-2 border-black shadow-brutal ${getStatusColor(entry.status)}`}>
                  {entry.status === 'success' ? '✅' : entry.status === 'partial' ? '⚠️' : '❌'}
                </div>
                <div>
                  <h3 className="text-black font-black">📁 {entry.filename}</h3>
                  <p className="text-gray-700 font-bold text-sm flex items-center gap-1">
                    📅 {formatDate(entry.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 border-2 border-black font-black text-xs ${
                  entry.status === 'success' ? 'bg-green-400 text-black' :
                  entry.status === 'partial' ? 'bg-yellow-400 text-black' :
                  'bg-red-400 text-black'
                }`}>
                  {entry.status.toUpperCase()}
                </div>
                <button
                  onClick={() => removeHistoryEntry(entry.id)}
                  className="px-2 py-1 bg-red-500 border-2 border-black font-black text-xs text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
                  title="Delete this entry"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Providers */}
            <div className="flex flex-wrap gap-2 mb-4">
              {entry.providers.map((provider) => (
                <div key={provider} className="px-2 py-1 bg-gray-200 border-2 border-black font-black text-xs">
                  {provider === 'vidguard' ? '🛡️' : provider === 'bigwarp' ? '🌊' : '🎬'} {provider.toUpperCase()}
                </div>
              ))}
            </div>

            {/* Results */}
            <div className="space-y-2">
              {entry.results.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 border-black ${result.success ? 'bg-green-400' : 'bg-red-400'}`}>
                    </div>
                    <div>
                      <p className="text-black font-black text-sm capitalize">
                        {result.provider === 'vidguard' ? '🛡️' : result.provider === 'bigwarp' ? '🌊' : '🎬'} {result.provider.toUpperCase()}
                      </p>
                      <p className={`text-xs font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅ SUCCESS!' : `❌ ${result.error}`}
                      </p>
                    </div>
                  </div>
                  {result.success && result.url && (
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-400 border-2 border-black font-black text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
                    >
                      🔗 OPEN
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
