'use client'

import { useState, useEffect, Suspense } from 'react'
import { redirect } from 'next/navigation'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const checkTokens = async () => {
      // Check if we have the necessary tokens in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken && refreshToken) {
        // We have recovery tokens in the hash
        setIsValidToken(true)
        
        // Set the session immediately so user can reset password
        try {
          const supabase = createClient()
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setIsValidToken(false)
            setError('Invalid or expired reset link. Please request a new password reset.')
          } else {
            // Clear the hash from URL for cleaner UX
            window.history.replaceState(null, '', window.location.pathname)
          }
        } catch (err) {
          console.error('Error setting session:', err)
          setIsValidToken(false)
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
      } else {
        // Check if we have an active recovery session
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User has an active session (might be from recovery)
          setIsValidToken(true)
        } else {
          // No tokens and no session - invalid link
          setIsValidToken(false)
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
      }
    }

    // Check immediately
    checkTokens()

    // Also listen for hash changes (in case hash loads after initial render)
    const handleHashChange = () => {
      checkTokens()
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Verify we have a session (should be set from the hash tokens in useEffect)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session || sessionError) {
        throw new Error('Invalid or expired reset link. Please request a new password reset.')
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message || 'Failed to reset password')
      }

      setSuccess(true)
      
      // Redirect to sign in after a moment
      setTimeout(() => {
        router.push('/auth/signin?message=Password reset successfully! Please sign in with your new password.')
      }, 2000)
    } catch (err) {
      setError((err as Error).message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-chazon-primary" />
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-8">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link href="/auth/forgot-password">
                <Button className="bg-chazon-primary hover:bg-chazon-primary-dark">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-chazon-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">CH</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Chazon</span>
            </div>

            {success ? (
              <>
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                  <p className="text-gray-600 mb-8">
                    Your password has been successfully reset. Redirecting to sign in...
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
                <p className="text-gray-600 mb-8">
                  Enter your new password below.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg bg-chazon-primary hover:bg-chazon-primary-dark shadow-lg shadow-chazon-primary/25 rounded-xl mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>Reset Password <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-8 text-center">
              <Link 
                href="/auth/signin" 
                className="text-sm font-medium text-chazon-primary hover:text-chazon-primary-dark"
              >
                Back to sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Image/Banner */}
      <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-chazon-primary">
          <Image
            src="https://images.unsplash.com/photo-1633265486064-086b219458ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Security lock"
            fill
            className="object-cover mix-blend-overlay opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-chazon-primary-dark/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-20 text-white">
            <h2 className="text-4xl font-bold mb-6">Create New Password</h2>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Choose a strong password to keep your account secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  redirect('/auth/signin')
  return null
}
