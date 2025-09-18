'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, User, Mail, CreditCard, HardDrive, Calendar, FileText, Crown } from 'lucide-react';

interface AccountInfo {
  username?: string;
  email?: string;
  storage?: {
    used: number;
    total: number;
  };
  bandwidth?: {
    used: number;
    total: number;
  };
  balance?: number;
  currency?: string;
  role?: string;
  createdAt?: string;
  filesTotal?: number;
  premiumExpire?: string;
}

export default function AccountContent() {
  const [accountInfo, setAccountInfo] = useState<Record<string, AccountInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/account');
      const data = await response.json();
      
      if (data.success) {
        setAccountInfo(data.accounts);
      } else {
        setError(data.error || 'Failed to fetch account info');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal p-8 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-black shadow-brutal">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <div>
            <h3 className="text-black font-black">LOADING ACCOUNTS! ⏳</h3>
            <p className="text-gray-700 font-bold text-sm">Getting your info...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal p-8 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform -rotate-1 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-black shadow-brutal">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-black font-black">ERROR LOADING! ❌</h3>
            <p className="text-gray-700 font-bold text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchAccountInfo} 
          className="px-4 py-2 bg-blue-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
        >
          🔄 TRY AGAIN
        </button>
      </div>
    );
  }

  if (Object.keys(accountInfo).length === 0) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal p-8 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 border-2 border-black shadow-brutal">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-black font-black">NO ACCOUNTS! 🔑</h3>
            <p className="text-gray-700 font-bold text-sm">Setup API keys first!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Neobrutalism Style */}
      <div className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-black shadow-brutal">
              👤
            </div>
            <div>
              <h2 className="text-black font-black text-lg">ACCOUNT INFO!</h2>
              <p className="text-gray-700 font-bold text-sm">Provider details!</p>
            </div>
          </div>
          <button
            onClick={fetchAccountInfo}
            className="px-4 py-2 bg-green-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
          >
            🔄 REFRESH
          </button>
        </div>
      </div>

      {/* Account Cards - Neobrutalism Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(accountInfo).map(([provider, info], index) => (
          <div key={provider} className={`bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all transform ${index % 2 === 0 ? '-rotate-0.5' : 'rotate-0.5'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 border-2 border-black shadow-brutal ${
                provider === 'vidguard' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                  : provider === 'bigwarp'
                  ? 'bg-gradient-to-r from-green-500 to-teal-500'
                  : provider === 'streamtape'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'bg-gradient-to-r from-orange-500 to-red-500'
              }`}>
                {provider === 'vidguard' ? '🛡️' : provider === 'bigwarp' ? '🌊' : provider === 'streamtape' ? '📼' : '🎬'}
              </div>
              <div>
                <h3 className="text-black font-black">{provider.toUpperCase()} ACCOUNT</h3>
                <p className="text-gray-700 font-bold text-sm">Provider details</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Email */}
              {info.email && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black">📧 EMAIL</span>
                  </div>
                  <p className="text-blue-600 font-bold">{info.email}</p>
                </div>
              )}

              {/* Username */}
              {info.username && info.username !== info.email && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black">👤 USERNAME</span>
                  </div>
                  <p className="text-purple-600 font-bold">{info.username}</p>
                </div>
              )}

              {/* Balance */}
              {info.balance !== undefined && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black">💰 BALANCE</span>
                  </div>
                  <p className="text-green-600 font-bold">
                    {info.currency || '$'}{info.balance.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Role */}
              {info.role && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">👑 ROLE</span>
                    <div className={`px-2 py-1 border-2 border-black font-black text-xs ${
                      info.role === 'premium' ? 'bg-yellow-400 text-black' : 'bg-gray-400 text-black'
                    }`}>
                      {info.role.toUpperCase()}
                    </div>
                  </div>
                </div>
              )}

              {/* Storage */}
              {info.storage && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-black">💾 STORAGE</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-black">Used: {formatBytes(info.storage.used)}</span>
                      <span className="text-black">Total: {formatBytes(info.storage.total)}</span>
                    </div>
                    <div className="w-full bg-gray-300 border-2 border-black h-3">
                      <div 
                        className="bg-cyan-400 h-full border-r-2 border-black transition-all duration-300"
                        style={{ 
                          width: `${Math.min((info.storage.used / info.storage.total) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Files Total */}
              {info.filesTotal !== undefined && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black">📁 FILES</span>
                  </div>
                  <p className="text-orange-600 font-bold">{info.filesTotal.toLocaleString()}</p>
                </div>
              )}

              {/* Premium Expiration */}
              {info.premiumExpire && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black">⏰ PREMIUM EXPIRES</span>
                  </div>
                  <p className="text-red-600 font-bold">{formatDate(info.premiumExpire)}</p>
                </div>
              )}

              {/* Created At */}
              {info.createdAt && (
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black">📅 MEMBER SINCE</span>
                  </div>
                  <p className="text-indigo-600 font-bold">{formatDate(info.createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
