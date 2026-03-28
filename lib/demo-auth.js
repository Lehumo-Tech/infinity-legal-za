'use client'

import { MEMBERS, STAFF } from './demo-data'

export const demoAuth = {
  login: (email, password) => {
    const member = MEMBERS.find(m => m.email === email && m.password === password)
    if (member) {
      const user = { ...member, role: 'member', portalType: 'member' }
      if (typeof window !== 'undefined') localStorage.setItem('demo_user', JSON.stringify(user))
      return { success: true, user, redirect: '/portal/member' }
    }
    const staff = STAFF.find(s => s.email === email && s.password === password)
    if (staff) {
      const user = { ...staff, portalType: staff.role === 'admin' ? 'admin' : 'staff' }
      if (typeof window !== 'undefined') localStorage.setItem('demo_user', JSON.stringify(user))
      const redirect = staff.role === 'admin' ? '/portal/admin' : '/portal/staff'
      return { success: true, user, redirect }
    }
    return { success: false, error: 'Invalid email or password' }
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('demo_user')
  },
  getUser: () => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('demo_user') || 'null') } catch { return null }
    }
    return null
  },
  isAuthenticated: () => {
    if (typeof window !== 'undefined') return !!localStorage.getItem('demo_user')
    return false
  },
}
