import { FileUploader } from '@/components/FileUploader';
import { ProviderSelector } from '@/components/ProviderSelector';
import { Navbar } from '@/components/Navbar';
import { Upload, Settings, History, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 relative">
      {/* Neobrutalism Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-500 rotate-12 shadow-brutal"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-blue-500 -rotate-12 shadow-brutal"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-green-500 rotate-45 shadow-brutal"></div>
        <div className="absolute top-20 right-1/3 w-20 h-20 bg-orange-500 -rotate-45 shadow-brutal"></div>
      </div>

      {/* Neobrutalism Header with Navigation */}
      <header className="bg-white border-4 border-black shadow-brutal sticky top-4 z-50 mx-4 mt-4">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-violet-500 border-2 border-black shadow-brutal rotate-3">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black transform -rotate-1">Multi-Provider Uploader ✨</h1>
                <p className="text-gray-700 font-bold text-sm transform rotate-1">Upload videos dengan style BRUTAL! 🎉</p>
              </div>
            </div>
            
            <Navbar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Provider Selection - Compact */}
            <div className="lg:col-span-1">
              <ProviderSelector />
            </div>
            
            {/* File Upload - Main Area */}
            <div className="lg:col-span-3">
              <FileUploader />
            </div>
          </div>

          {/* Neobrutalism Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-black shadow-brutal">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-black font-black">SUPER FAST! 🚀</h3>
                  <p className="text-gray-700 font-bold text-sm">Multiple providers!</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform -rotate-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-black shadow-brutal">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-black font-black">SUPER SECURE! 🔒</h3>
                  <p className="text-gray-700 font-bold text-sm">API keys safe!</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border-4 border-black shadow-brutal p-4 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all transform rotate-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-black shadow-brutal">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-black font-black">TRACK ALL! 📊</h3>
                  <p className="text-gray-700 font-bold text-sm">Real-time monitor!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
