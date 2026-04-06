'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

const ROLE_TIERS = {
  managing_director: 100, deputy_md: 95, admin: 100,
  senior_partner: 90, associate: 80, junior_attorney: 70,
  paralegal: 50, legal_assistant: 40,
  operations_director: 75, office_manager: 60,
  cfo: 85, billing_specialist: 55,
  marketing_director: 65, client_relations: 45, intake_agent: 30,
  it_director: 75, systems_admin: 70,
  hr_director: 75, client: 10,
  // Legacy
  managing_partner: 100, legal_officer: 80, attorney: 80, it_admin: 70,
}

const ROLE_LABELS = {
  managing_director: 'Managing Director', deputy_md: 'Deputy Managing Director',
  admin: 'Administrator (Full Access)',
  senior_partner: 'Senior Partner', associate: 'Associate Attorney',
  junior_attorney: 'Junior Attorney', paralegal: 'Paralegal',
  legal_assistant: 'Legal Assistant',
  operations_director: 'Operations Director', office_manager: 'Office Manager',
  cfo: 'Chief Financial Officer', billing_specialist: 'Billing Specialist',
  marketing_director: 'Marketing Director', client_relations: 'Client Relations',
  intake_agent: 'Intake Specialist',
  it_director: 'IT Director', systems_admin: 'Systems Administrator',
  hr_director: 'HR Director', client: 'Client',
  // Legacy
  managing_partner: 'Managing Partner', legal_officer: 'Legal Officer',
  attorney: 'Attorney', it_admin: 'IT Administrator',
}

const DEPARTMENTS = {
  managing_director: 'Executive', deputy_md: 'Executive',
  admin: 'Executive',
  senior_partner: 'Legal', associate: 'Legal', junior_attorney: 'Legal',
  paralegal: 'Legal', legal_assistant: 'Legal',
  operations_director: 'Operations', office_manager: 'Operations',
  cfo: 'Finance', billing_specialist: 'Finance',
  marketing_director: 'Business Development', client_relations: 'Business Development',
  intake_agent: 'Business Development',
  it_director: 'IT & Technology', systems_admin: 'IT & Technology',
  hr_director: 'Human Resources', client: 'Client',
  managing_partner: 'Executive', legal_officer: 'Legal', attorney: 'Legal', it_admin: 'IT & Technology',
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
      if (error) { console.error('Profile fetch error:', error); return }
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

  const refreshProfile = async () => { if (user) await fetchProfile(user.id) }

  const role = profile?.role || 'client'
  const roleTier = ROLE_TIERS[role] || 0
  const roleLabel = ROLE_LABELS[role] || role
  const department = DEPARTMENTS[role] || 'General'

  // Legal staff groups - admin gets full access to everything
  const legalRoles = ['managing_director', 'deputy_md', 'senior_partner', 'associate', 'junior_attorney', 'paralegal', 'legal_assistant', 'managing_partner', 'legal_officer', 'attorney', 'admin']
  const officerRoles = ['managing_director', 'deputy_md', 'senior_partner', 'associate', 'junior_attorney', 'managing_partner', 'legal_officer', 'attorney', 'admin']
  const directorRoles = ['managing_director', 'deputy_md', 'operations_director', 'cfo', 'marketing_director', 'it_director', 'hr_director', 'managing_partner', 'admin']
  const financeRoles = ['managing_director', 'deputy_md', 'cfo', 'billing_specialist', 'managing_partner', 'admin']
  const hrRoles = ['managing_director', 'deputy_md', 'hr_director', 'managing_partner', 'admin']
  const itRoles = ['managing_director', 'deputy_md', 'it_director', 'systems_admin', 'managing_partner', 'it_admin', 'admin']

  const value = {
    user, profile, loading: loading || !mounted, signOut, refreshProfile,
    isAuthenticated: !!user,
    
    // Role info
    role, roleTier, roleLabel, department,
    
    // Identity checks
    isManagingDirector: role === 'managing_director' || role === 'managing_partner',
    isDeputyMD: role === 'deputy_md',
    isSeniorPartner: role === 'senior_partner',
    isAssociate: role === 'associate' || role === 'legal_officer' || role === 'attorney',
    isJuniorAttorney: role === 'junior_attorney',
    isParalegal: role === 'paralegal',
    isLegalAssistant: role === 'legal_assistant',
    isIntakeAgent: role === 'intake_agent',
    isITStaff: itRoles.includes(role),
    isHRStaff: hrRoles.includes(role),
    isFinanceStaff: financeRoles.includes(role),
    
    // Group checks
    isOfficer: officerRoles.includes(role),
    isLegalStaff: legalRoles.includes(role),
    isDirector: directorRoles.includes(role),
    isStaff: roleTier >= 30,
    isClient: role === 'client',
    canAccessPortal: roleTier >= 30,
    
    // Legacy compatibility
    isManagingPartner: role === 'managing_director' || role === 'managing_partner',
    isLegalOfficer: officerRoles.includes(role),
    isAttorney: officerRoles.includes(role),
    isAdmin: role === 'admin' || role === 'managing_director' || role === 'operations_director' || role === 'office_manager',
    isITAdmin: itRoles.includes(role),

    // Permission checker — admin has all permissions
    hasPermission: (permission) => {
      if (role === 'admin') return true
      const PERMS = {
        VIEW_ALL_CASES: [...officerRoles, 'paralegal'],
        CREATE_CASE: [...officerRoles, 'paralegal', 'intake_agent'],
        APPROVE_DOCUMENT: officerRoles,
        SIGN_DOCUMENT: officerRoles,
        VIEW_PRIVILEGED_NOTES: officerRoles,
        CREATE_PRIVILEGED_NOTES: officerRoles,
        VIEW_LEADS: [...officerRoles, 'paralegal', 'intake_agent', 'client_relations', 'marketing_director'],
        CREATE_LEAD: ['managing_director', 'deputy_md', 'intake_agent', 'client_relations', 'managing_partner', 'admin'],
        QUALIFY_LEAD: ['managing_director', 'deputy_md', 'intake_agent', 'managing_partner', 'admin'],
        MANAGE_USERS: ['managing_director', 'deputy_md', 'it_director', 'systems_admin', 'hr_director', 'managing_partner', 'it_admin', 'admin'],
        VIEW_AUDIT_LOGS: ['managing_director', 'deputy_md', 'it_director', 'systems_admin', 'managing_partner', 'it_admin', 'admin'],
        VIEW_BILLING: [...financeRoles, 'senior_partner'],
        SEND_TO_CLIENT: officerRoles,
        VIEW_HR: hrRoles,
        VIEW_REPORTS: [...directorRoles, 'senior_partner', 'cfo'],
      }
      return (PERMS[permission] || []).includes(role)
    },
  }

  if (!mounted) {
    return <AuthContext.Provider value={{ ...value, loading: true }}>{children}</AuthContext.Provider>
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
