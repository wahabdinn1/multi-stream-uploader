'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Get the updated session
        const session = await getSession()
        if (session) {
          router.push('/')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Login failed. Please try again.')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-brutal max-w-md w-full p-8 transform -rotate-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-black mb-2">WELCOME BACK! 👋</h1>
          <p className="text-gray-600 font-bold">Login to your account</p>
        </div>

        {message && (
          <div className="bg-green-100 border-3 border-green-500 p-4 mb-6 transform rotate-1">
            <p className="text-green-800 font-bold">✅ {message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-3 border-red-500 p-4 mb-6 transform rotate-1">
            <p className="text-red-800 font-bold">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full p-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-400"
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
              className="w-full p-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-400"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-400 border-3 border-black font-black text-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-brutal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN! 🚀'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 font-bold">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-blue-600 font-black hover:underline"
            >
              REGISTER HERE!
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white border-4 border-black shadow-brutal p-8 transform rotate-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-black border-t-transparent" />
            <span className="text-black font-black">LOADING...</span>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
