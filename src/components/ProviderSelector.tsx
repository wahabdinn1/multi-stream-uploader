'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';

export function ProviderSelector() {
  const {
    selectedProviders,
    providerStatus,
    setSelectedProviders,
    setProviderStatus,
  } = useAppStore();

  useEffect(() => {
    // Fetch provider status on mount
    const fetchProviderStatus = async () => {
      try {
        const response = await fetch('/api/keys');
        const result = await response.json();
        
        if (result.success) {
          setProviderStatus(result.providers);
        }
      } catch (error) {
        console.error('Failed to fetch provider status:', error);
      }
    };

    fetchProviderStatus();
  }, [setProviderStatus]);

  const handleProviderToggle = (provider: string, checked: boolean) => {
    if (checked) {
      setSelectedProviders([...selectedProviders, provider]);
    } else {
      setSelectedProviders(selectedProviders.filter(p => p !== provider));
    }
  };

  const availableProviders = Object.keys(providerStatus);
  const configuredProviders = availableProviders.filter(p => providerStatus[p]);

  return (
    <div className="bg-white border-4 border-black shadow-brutal transform -rotate-1">
      <div className="p-4 border-b-4 border-black">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-black shadow-brutal rotate-12">
            🎯
          </div>
          <div>
            <h3 className="text-black font-black text-lg">SELECT PROVIDERS</h3>
            <p className="text-gray-700 font-bold text-sm">Choose upload targets! 🚀</p>
          </div>
        </div>
      </div>
      <div className="bg-yellow-200 border-3 border-black shadow-brutal p-3 mt-4 transform -rotate-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-black shadow-brutal rotate-12">
            💡
          </div>
          <h4 className="text-black font-black">BRUTAL TIPS</h4>
        </div>
        <ul className="text-black space-y-1 text-xs font-bold">
          <li className="flex items-start gap-2">
            <span className="text-red-600 font-black">•</span>
            <span>Select multiple for BACKUP! 🔄</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 font-black">•</span>
            <span>Setup API keys in SETTINGS! 🔑</span>
          </li>
        </ul>
      </div>
      <div className="p-4 space-y-3">
        {availableProviders.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">
              Loading providers... 🔄
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-black font-black flex items-center gap-2">
              🔧 AVAILABLE PROVIDERS
            </h4>
            
            {availableProviders.map((provider, index) => (
              <div 
                key={provider}
                className="bg-gray-50 border-3 border-black shadow-brutal p-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all transform rotate-1 group"
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedProviders.includes(provider)}
                      onChange={(e) => handleProviderToggle(provider, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`
                      w-6 h-6 border-3 border-black transition-all duration-300
                      ${selectedProviders.includes(provider)
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-brutal'
                        : 'bg-white hover:bg-cyan-100'
                      }
                    `}>
                      {selectedProviders.includes(provider) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white text-sm font-black">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 border-2 border-black shadow-brutal ${
                        provider === 'vidguard' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : provider === 'bigwarp'
                          ? 'bg-gradient-to-r from-green-500 to-teal-500'
                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                      }`}>
                        <span className="text-sm">
                          {provider === 'vidguard' ? '🛡️' : provider === 'bigwarp' ? '🌊' : '🎬'}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-black font-black capitalize group-hover:text-blue-600 transition-colors text-sm">
                          {provider.toUpperCase()}
                        </h4>
                        <p className="text-gray-600 font-bold text-xs">
                          {provider === 'vidguard' 
                            ? 'Video hosting' 
                            : provider === 'bigwarp'
                            ? 'File storage'
                            : 'Video streaming'
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 border-2 border-black ${
                          providerStatus[provider] 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}></div>
                        <span className={`text-xs font-black ${
                          providerStatus[provider] 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {providerStatus[provider] ? 'READY' : 'SETUP'}
                        </span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
            
            {configuredProviders.length === 0 && (
              <div className="text-center py-8 space-y-4">                
                <div className="space-y-2">
                  <p className="text-black text-lg font-black">
                    NO PROVIDERS CONFIGURED!
                  </p>
                  <p className="text-gray-700 font-bold">
                    Go to SETTINGS to add API keys! 🔑
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
