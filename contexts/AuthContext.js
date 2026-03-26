'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

const ROLE_TIERS = {
  managing_partner: 100,
  legal_officer: 80,
  attorney: 80,
  it_admin: 70,
  admin: 60,
  paralegal: 50,
  intake_agent: 30,
  client: 10,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch error:', error)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // Role helper functions
  const role = profile?.role || 'client'
  const effectiveRole = role === 'attorney' ? 'legal_officer' : role
  const roleTier = ROLE_TIERS[role] || 0

  const value = {
    user,
    profile,
    loading: loading || !mounted,
    signOut,
    refreshProfile,
    isAuthenticated: !!user,
    // Legacy helpers
    isAttorney: role === 'attorney' || role === 'legal_officer',
    isClient: role === 'client',
    isAdmin: role === 'admin',
    // New role helpers
    role,
    effectiveRole,
    roleTier,
    isManagingPartner: role === 'managing_partner',
    isLegalOfficer: role === 'legal_officer' || role === 'attorney',
    isParalegal: role === 'paralegal',
    isIntakeAgent: role === 'intake_agent',
    isITAdmin: role === 'it_admin',
    isStaff: roleTier >= 30, // Intake agent and above
    isLegalStaff: ['managing_partner', 'legal_officer', 'paralegal', 'attorney'].includes(role),
    isOfficer: ['managing_partner', 'legal_officer', 'attorney'].includes(role),
    canAccessPortal: roleTier >= 30,
    hasPermission: (permission) => {
      const PERMISSIONS = {
        VIEW_ALL_CASES: ['managing_partner', 'legal_officer', 'paralegal'],
        VIEW_ASSIGNED_CASES: ['managing_partner', 'legal_officer', 'paralegal'],
        APPROVE_DOCUMENT: ['managing_partner', 'legal_officer'],
        SIGN_DOCUMENT: ['managing_partner', 'legal_officer'],
        VIEW_PRIVILEGED_NOTES: ['managing_partner', 'legal_officer'],
        CREATE_PRIVILEGED_NOTES: ['managing_partner', 'legal_officer'],
        VIEW_LEADS: ['managing_partner', 'legal_officer', 'paralegal', 'intake_agent'],
        CREATE_LEAD: ['managing_partner', 'intake_agent'],
        QUALIFY_LEAD: ['managing_partner', 'intake_agent'],
        MANAGE_USERS: ['managing_partner', 'it_admin'],
        VIEW_AUDIT_LOGS: ['managing_partner', 'it_admin'],
        VIEW_BILLING: ['managing_partner', 'legal_officer', 'admin'],
        SEND_TO_CLIENT: ['managing_partner', 'legal_officer'],
      }
      const allowed = PERMISSIONS[permission] || []
      return allowed.includes(effectiveRole)
    },
  }

  if (!mounted) {
    return (
      <AuthContext.Provider value={{ ...value, loading: true }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
