import { ProviderManager } from '../../../components/ProviderManager';
import { Navbar } from '@/components/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const provider = params.slug;
  const validProviders = ['doodstream', 'streamtape', 'vidguard', 'bigwarp'];
  
  if (!validProviders.includes(provider)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Navbar />
        <div className="pt-20 p-8 flex items-center justify-center">
          <div className="bg-white border-4 border-black shadow-brutal p-8 text-center transform -rotate-1">
            <h1 className="text-2xl font-black text-red-600 mb-4">INVALID PROVIDER! ❌</h1>
            <p className="text-black font-bold">Provider "{provider}" not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <div className="pt-20 p-8">
        <ProviderManager provider={provider} />
      </div>
    </div>
  );
}
