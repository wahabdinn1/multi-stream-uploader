'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to login page on success
      router.push('/login?message=Registration successful! Please log in.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-brutal max-w-md w-full p-8 transform rotate-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-black mb-2">CREATE ACCOUNT! 🚀</h1>
          <p className="text-gray-600 font-bold">Join the multi-provider uploader</p>
        </div>

        {error && (
          <div className="bg-red-100 border-3 border-red-500 p-4 mb-6 transform -rotate-1">
            <p className="text-red-800 font-bold">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-black text-black mb-2">
              FULL NAME
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-black text-black mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-black text-black mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full p-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-green-400 border-3 border-black font-black text-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT! 🎉'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 font-bold">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-purple-600 font-black hover:underline"
            >
              LOGIN HERE!
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
