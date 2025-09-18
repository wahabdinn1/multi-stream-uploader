'use client';

import { Settings, History, Upload, User, ChevronDown, Folder, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ProviderManager } from './ProviderManager';

export function Navbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { data: session } = useSession();

  const providers = [
    { name: 'doodstream', label: 'DOODSTREAM', icon: '🎬', gradient: 'from-purple-500 to-pink-500' },
    { name: 'streamtape', label: 'STREAMTAPE', icon: '📼', gradient: 'from-purple-500 to-pink-500' },
    { name: 'vidguard', label: 'VIDGUARD', icon: '🛡️', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'bigwarp', label: 'BIGWARP', icon: '🌊', gradient: 'from-cyan-500 to-blue-500' }
  ];

  const navItems = [
    {
      href: '/',
      icon: Upload,
      label: 'UPLOAD',
      activeColors: 'bg-gradient-to-r from-pink-500 to-violet-500 text-white transform rotate-1',
      hoverColors: 'hover:bg-pink-100'
    },
    {
      href: '/account',
      icon: User,
      label: 'ACCOUNT',
      activeColors: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white transform -rotate-1',
      hoverColors: 'hover:bg-blue-100'
    },
    {
      href: '/history',
      icon: History,
      label: 'HISTORY',
      activeColors: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white transform rotate-1',
      hoverColors: 'hover:bg-green-100'
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'SETTINGS',
      activeColors: 'bg-gradient-to-r from-orange-500 to-red-500 text-white transform -rotate-1',
      hoverColors: 'hover:bg-orange-100'
    },
    ...(session?.user?.role === 'SUPER_ADMIN' ? [{
      href: '/admin',
      icon: Shield,
      label: 'ADMIN',
      activeColors: 'bg-gradient-to-r from-red-500 to-pink-500 text-white transform rotate-1',
      hoverColors: 'hover:bg-red-100'
    }] : [])
  ];

  return (
    <nav className="flex gap-2">
      {navItems.map(({ href, icon: Icon, label, activeColors, hoverColors }) => {
        const isActive = pathname === href;
        
        return (
          <Link
            key={href}
            href={href}
            className={`p-3 font-black text-sm border-3 border-black shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
              isActive 
                ? activeColors
                : `bg-white text-black ${hoverColors}`
            }`}
          >
            <Icon className="h-4 w-4 mx-auto mb-1" />
            <span className="hidden sm:block">{label}</span>
          </Link>
        );
      })}
      
      {/* Providers Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'providers' ? null : 'providers')}
          className={`p-3 font-black text-sm border-3 border-black shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center gap-1 ${
            pathname.startsWith('/provider') 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white transform rotate-1'
              : 'bg-white text-black hover:bg-indigo-100'
          }`}
        >
          <Folder className="h-4 w-4 mx-auto mb-1" />
          <span className="hidden sm:block">PROVIDERS</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === 'providers' ? 'rotate-180' : ''}`} />
        </button>
        
        {openDropdown === 'providers' && (
          <div className="absolute top-full left-0 mt-2 bg-white border-3 border-black shadow-brutal z-50 min-w-[200px]">
            {providers.map((provider) => (
              <button
                key={provider.name}
                onClick={() => {
                  setSelectedProvider(provider.name);
                  setOpenDropdown(null);
                }}
                className={`block w-full p-3 font-black text-sm border-b-2 border-black last:border-b-0 transition-all hover:translate-x-1 hover:bg-gray-100 text-left ${
                  selectedProvider === provider.name 
                    ? `bg-gradient-to-r ${provider.gradient} text-white`
                    : 'text-black'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{provider.icon}</span>
                  <span>{provider.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* User Menu Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
          className="p-3 font-black text-sm border-3 border-black shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white transform -rotate-1"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:block">{session?.user?.name || 'USER'}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === 'user' ? 'rotate-180' : ''}`} />
        </button>
        
        {openDropdown === 'user' && (
          <div className="absolute top-full right-0 mt-2 bg-white border-3 border-black shadow-brutal z-50 min-w-[200px]">
            <div className="p-3 border-b-2 border-black bg-gray-50">
              <p className="font-black text-sm text-black">{session?.user?.name}</p>
              <p className="text-xs text-gray-600 font-bold">{session?.user?.email}</p>
              <span className={`inline-block px-2 py-1 text-xs font-black border-2 border-black mt-1 ${
                session?.user?.role === 'SUPER_ADMIN' 
                  ? 'bg-red-400 text-black' 
                  : 'bg-blue-400 text-black'
              }`}>
                {session?.user?.role}
              </span>
            </div>
            <button
              onClick={() => {
                signOut({ callbackUrl: '/login' });
                setOpenDropdown(null);
              }}
              className="block w-full p-3 font-black text-sm transition-all hover:translate-x-1 hover:bg-red-100 text-left text-red-600 border-b-2 border-black last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>LOGOUT</span>
              </div>
            </button>
          </div>
        )}
      </div>
      
      {/* Provider Modal Overlay */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white border-4 border-black shadow-brutal w-full h-full max-w-none max-h-none overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b-3 border-black">
              <h2 className="text-xl font-black text-black">
                {providers.find(p => p.name === selectedProvider)?.icon} {providers.find(p => p.name === selectedProvider)?.label} MANAGER
              </h2>
              <button
                onClick={() => setSelectedProvider(null)}
                className="px-4 py-2 bg-red-400 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal"
              >
                ✕ CLOSE
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-120px)]">
              <ProviderManager provider={selectedProvider} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
