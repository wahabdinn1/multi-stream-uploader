'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { Key, Trash2, Eye, EyeOff, Save } from 'lucide-react';

interface ProviderConfig {
  name: string;
  configured: boolean;
  key?: string;
}

export default function SettingsContent() {
  const { setProviderStatus } = useAppStore();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    try {
      const [statusResponse, allowedResponse, keysResponse] = await Promise.all([
        fetch('/api/keys'),
        fetch('/api/keys/allowed'),
        fetch('/api/keys/values')
      ]);

      const statusResult = await statusResponse.json();
      const allowedResult = await allowedResponse.json();
      const keysResult = await keysResponse.json();

      if (statusResult.success && allowedResult.success && keysResult.success) {
        const providerConfigs: ProviderConfig[] = allowedResult.providers.map((name: string) => ({
          name,
          configured: statusResult.providers[name] || false,
          key: keysResult.keys[name] || '',
        }));
        
        setProviders(providerConfigs);
        setProviderStatus(statusResult.providers);
      }
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (providerName: string, key: string) => {
    if (!key.trim()) return;

    setSaving(providerName);
    try {
      const response = await fetch('/api/keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerName,
          key: key.trim(),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setProviders(prev => 
          prev.map(p => 
            p.name === providerName 
              ? { ...p, configured: true, key: '' }
              : p
          )
        );
        
        await fetchProviderStatus();
      } else {
        alert(`Failed to save API key: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Failed to save API key');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteKey = async (providerName: string) => {
    if (!confirm(`Are you sure you want to delete the API key for ${providerName}?`)) {
      return;
    }

    setSaving(providerName);
    try {
      const response = await fetch('/api/keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerName,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setProviders(prev => 
          prev.map(p => 
            p.name === providerName 
              ? { ...p, configured: false, key: '' }
              : p
          )
        );
        
        await fetchProviderStatus();
      } else {
        alert(`Failed to delete API key: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    } finally {
      setSaving(null);
    }
  };

  const toggleKeyVisibility = (providerName: string) => {
    setShowKeys(prev => ({
      ...prev,
      [providerName]: !prev[providerName]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-white/70">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice - Neobrutalism Style */}
      <div className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-black shadow-brutal">
            🔒
          </div>
          <div>
            <h3 className="text-black font-black">SECURITY NOTICE! 🛡️</h3>
            <p className="text-gray-700 font-bold text-sm">API keys stored locally for dev!</p>
          </div>
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold gradient-text mb-4">🔑 Provider API Keys</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {providers.map((provider, index) => (
            <div 
              key={provider.name} 
              className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform -rotate-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 border-2 border-black shadow-brutal ${
                    provider.name === 'vidguard' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : provider.name === 'bigwarp'
                      ? 'bg-gradient-to-r from-green-500 to-teal-500'
                      : provider.name === 'streamtape'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}>
                    {provider.name === 'vidguard' ? '🛡️' : provider.name === 'bigwarp' ? '🌊' : provider.name === 'streamtape' ? '📼' : '🎬'}
                  </div>
                  <div>
                    <h3 className="text-black font-black capitalize">{provider.name.toUpperCase()}</h3>
                    <p className="text-gray-700 font-bold text-sm">
                      {provider.name === 'vidguard' 
                        ? 'Secure video hosting' 
                        : provider.name === 'bigwarp'
                        ? 'File storage & sharing'
                        : provider.name === 'streamtape'
                        ? 'Fast video streaming'
                        : 'Video streaming platform'
                      }
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 border-2 border-black font-black text-xs ${
                  provider.configured 
                    ? 'bg-green-400 text-black' 
                    : 'bg-red-400 text-black'
                }`}>
                  {provider.configured ? '✅ READY' : '⚙️ SETUP'}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-black font-black text-sm">🔐 API KEY</label>
                  {provider.configured && provider.key ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type={showKeys[provider.name] ? 'text' : 'password'}
                          value={showKeys[provider.name] ? provider.key : '••••••••••••••••'}
                          readOnly
                          className="flex-1 p-2 border-3 border-black font-bold text-black bg-gray-100"
                        />
                        <button
                          onClick={() => toggleKeyVisibility(provider.name)}
                          className="px-3 py-2 bg-gray-200 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
                        >
                          {showKeys[provider.name] ? '👁️' : '🙈'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 font-bold">
                        {provider.name === 'streamtape' ? 'Current saved login:key' : 'Current saved API key'}
                      </div>
                    </div>
                  ) : null}
                  
                  {provider.name === 'streamtape' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeys[`${provider.name}_login`] || ''}
                          onChange={(e) => setNewKeys(prev => ({
                            ...prev,
                            [`${provider.name}_login`]: e.target.value
                          }))}
                          placeholder="✨ Enter API Login"
                          className="flex-1 p-2 border-3 border-black font-bold text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeys[`${provider.name}_key`] || ''}
                          onChange={(e) => setNewKeys(prev => ({
                            ...prev,
                            [`${provider.name}_key`]: e.target.value
                          }))}
                          placeholder="✨ Enter API Key"
                          className="flex-1 p-2 border-3 border-black font-bold text-black placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeys[provider.name] || ''}
                        onChange={(e) => setNewKeys(prev => ({
                          ...prev,
                          [provider.name]: e.target.value
                        }))}
                        placeholder={provider.configured ? '✨ Enter new API key' : '✨ Enter API key'}
                        className="flex-1 p-2 border-3 border-black font-bold text-black placeholder:text-gray-500"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (provider.name === 'streamtape') {
                        const login = newKeys[`${provider.name}_login`] || '';
                        const key = newKeys[`${provider.name}_key`] || '';
                        const combinedKey = login && key ? `${login}:${key}` : '';
                        handleSaveKey(provider.name, combinedKey);
                      } else {
                        handleSaveKey(provider.name, newKeys[provider.name] || '');
                      }
                    }}
                    disabled={
                      provider.name === 'streamtape' 
                        ? (!newKeys[`${provider.name}_login`] || !newKeys[`${provider.name}_key`] || saving === provider.name)
                        : (!newKeys[provider.name] || saving === provider.name)
                    }
                    className="flex-1 px-4 py-2 bg-green-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50"
                  >
                    {saving === provider.name ? '💾 SAVING...' : '💾 SAVE KEY'}
                  </button>
                  
                  {provider.configured && (
                    <button
                      onClick={() => handleDeleteKey(provider.name)}
                      disabled={saving === provider.name}
                      className="px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
