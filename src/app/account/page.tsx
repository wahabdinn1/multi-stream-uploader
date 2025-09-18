import { Navbar } from '@/components/Navbar';
import AccountContent from '@/components/AccountContent';
import { Upload } from 'lucide-react';

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-cyan-300 to-blue-400 relative">
      {/* Neobrutalism Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500 rotate-12 shadow-brutal"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-purple-500 -rotate-12 shadow-brutal"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-pink-500 rotate-45 shadow-brutal"></div>
        <div className="absolute top-20 right-1/3 w-20 h-20 bg-yellow-500 -rotate-45 shadow-brutal"></div>
      </div>

      {/* Neobrutalism Header with Navigation */}
      <header className="bg-white border-4 border-black shadow-brutal sticky top-0 z-50">
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
        <AccountContent />
      </main>
    </div>
  );
}
