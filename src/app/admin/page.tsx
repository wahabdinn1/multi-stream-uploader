'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    providerKeys: number
    history: number
  }
}

interface ProviderKey {
  id: string
  provider: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface UploadHistory {
  id: string
  filename: string
  provider: string
  status: string
  url: string | null
  createdAt: string
  user: {
    name: string
    email: string
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([])
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'history'>('users')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/')
      return
    }

    fetchAdminData()
  }, [session, status, router])

  const fetchAdminData = async () => {
    try {
      const [usersRes, keysRes, historyRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/keys'),
        fetch('/api/admin/history')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json()
        setProviderKeys(keysData.keys || [])
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setUploadHistory(historyData.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 flex items-center justify-center">
        <div className="bg-white border-4 border-black shadow-brutal p-8 transform rotate-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-black border-t-transparent" />
            <span className="text-black font-black">LOADING ADMIN PANEL...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-purple-400 to-blue-400 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black shadow-brutal p-6 mb-6 transform -rotate-1">
          <h1 className="text-3xl font-black text-black mb-2">SUPER ADMIN DASHBOARD 👑</h1>
          <p className="text-gray-600 font-bold">Manage users, API keys, and upload history</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {[
            { key: 'users', label: 'USERS', icon: '👥' },
            { key: 'keys', label: 'API KEYS', icon: '🔑' },
            { key: 'history', label: 'UPLOADS', icon: '📁' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 border-3 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal ${
                activeTab === tab.key 
                  ? 'bg-yellow-400 text-black' 
                  : 'bg-white text-black'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div className="bg-white border-4 border-black shadow-brutal p-6 transform rotate-1">
            <h2 className="text-2xl font-black text-black mb-4">ALL USERS ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-3 border-black">
                    <th className="text-left font-black text-black p-3">NAME</th>
                    <th className="text-left font-black text-black p-3">EMAIL</th>
                    <th className="text-left font-black text-black p-3">ROLE</th>
                    <th className="text-left font-black text-black p-3">API KEYS</th>
                    <th className="text-left font-black text-black p-3">UPLOADS</th>
                    <th className="text-left font-black text-black p-3">JOINED</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-300">
                      <td className="p-3 font-bold text-black">{user.name}</td>
                      <td className="p-3 font-bold text-gray-600">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 border-2 border-black font-black text-xs ${
                          user.role === 'SUPER_ADMIN' ? 'bg-red-400' : 'bg-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-black">{user._count.providerKeys}</td>
                      <td className="p-3 font-bold text-black">{user._count.history}</td>
                      <td className="p-3 font-bold text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="bg-white border-4 border-black shadow-brutal p-6 transform -rotate-1">
            <h2 className="text-2xl font-black text-black mb-4">ALL API KEYS ({providerKeys.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-3 border-black">
                    <th className="text-left font-black text-black p-3">PROVIDER</th>
                    <th className="text-left font-black text-black p-3">USER</th>
                    <th className="text-left font-black text-black p-3">EMAIL</th>
                    <th className="text-left font-black text-black p-3">CREATED</th>
                  </tr>
                </thead>
                <tbody>
                  {providerKeys.map((key) => (
                    <tr key={key.id} className="border-b border-gray-300">
                      <td className="p-3">
                        <span className={`px-2 py-1 border-2 border-black font-black text-xs ${
                          key.provider === 'vidguard' ? 'bg-blue-400' :
                          key.provider === 'bigwarp' ? 'bg-green-400' :
                          key.provider === 'streamtape' ? 'bg-purple-400' :
                          'bg-orange-400'
                        }`}>
                          {key.provider.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-black">{key.user.name}</td>
                      <td className="p-3 font-bold text-gray-600">{key.user.email}</td>
                      <td className="p-3 font-bold text-gray-600">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white border-4 border-black shadow-brutal p-6 transform rotate-1">
            <h2 className="text-2xl font-black text-black mb-4">UPLOAD HISTORY ({uploadHistory.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-3 border-black">
                    <th className="text-left font-black text-black p-3">FILENAME</th>
                    <th className="text-left font-black text-black p-3">PROVIDER</th>
                    <th className="text-left font-black text-black p-3">STATUS</th>
                    <th className="text-left font-black text-black p-3">USER</th>
                    <th className="text-left font-black text-black p-3">UPLOADED</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map((upload) => (
                    <tr key={upload.id} className="border-b border-gray-300">
                      <td className="p-3 font-bold text-black">{upload.filename}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 border-2 border-black font-black text-xs ${
                          upload.provider === 'vidguard' ? 'bg-blue-400' :
                          upload.provider === 'bigwarp' ? 'bg-green-400' :
                          upload.provider === 'streamtape' ? 'bg-purple-400' :
                          'bg-orange-400'
                        }`}>
                          {upload.provider.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 border-2 border-black font-black text-xs ${
                          upload.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                        }`}>
                          {upload.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-600">{upload.user.name}</td>
                      <td className="p-3 font-bold text-gray-600">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
