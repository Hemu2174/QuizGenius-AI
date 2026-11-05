import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Formats Supabase user into friendly object with display name & metadata
  const formatUser = (sbUser) => {
    if (!sbUser) return null
    const meta = sbUser.user_metadata || {}
    const fullName =
      meta.full_name ||
      meta.name ||
      (sbUser.email ? sbUser.email.split('@')[0].charAt(0).toUpperCase() + sbUser.email.split('@')[0].slice(1) : 'Student')

    return {
      id: sbUser.id,
      email: sbUser.email,
      name: fullName,
      role: meta.role || 'Student',
      institution: meta.institution || 'Self-Study Learner',
      user_metadata: meta,
      created_at: sbUser.created_at,
    }
  }

  // Initialize session and listen for auth state transitions
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.warn('Error fetching Supabase session:', error.message)
        }

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession)
            setUser(formatUser(initialSession.user))
          } else {
            setSession(null)
            setUser(null)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Unexpected auth initialization error:', err)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      if (newSession?.user) {
        setSession(newSession)
        setUser(formatUser(newSession.user))
      } else {
        setSession(null)
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      throw new Error('Please provide both email and password.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      throw new Error(error.message || 'Login failed. Please check your credentials.')
    }

    if (data.session) {
      setSession(data.session)
      setUser(formatUser(data.user))
    }

    return { success: true, user: data.user }
  }, [])

  const signup = useCallback(async ({ name, email, password }) => {
    if (!email || !password) {
      throw new Error('Email and password are required.')
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name ? name.trim() : '',
        },
      },
    })

    if (error) {
      throw new Error(error.message || 'Registration failed. Please try again.')
    }

    // Try creating profile record in public.profiles (in case DB trigger is not active)
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name ? name.trim() : email.split('@')[0],
          email: email.trim(),
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        // Non-blocking if table is not yet created
        console.debug('Optional profiles upsert skipped:', err)
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('SignOut warning:', err)
    } finally {
      setSession(null)
      setUser(null)
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!email) {
      throw new Error('Please enter your email address.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      throw new Error(error.message || 'Failed to send password recovery email.')
    }

    return { success: true }
  }, [])

  const updateProfile = useCallback(
    async (profileData) => {
      if (!user) return

      // Update user metadata in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: profileData,
      })

      if (error) throw new Error(error.message)

      // Also attempt update in public.profiles table
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: profileData.full_name || profileData.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      } catch (e) {
        // Non-blocking
      }

      setUser(formatUser(data.user))
      return { success: true }
    },
    [user]
  )

  const value = {
    user,
    session,
    loading,
    isAuthenticated: Boolean(session && user),
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
