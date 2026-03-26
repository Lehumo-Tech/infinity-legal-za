'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const { profile, user, roleLabel, department, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' })

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwMessage({ type: '', text: '' })
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwMessage({ type: 'success', text: 'Password updated successfully' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message || 'Failed to update password' })
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Settings</h1>
        <p className="text-sm text-infinity-navy/50 dark:text-white/40">Manage your profile and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
              <input type="text" value={`${roleLabel} — ${department}`} disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveProfile} disabled={saving}
              className="px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span className="text-xs text-green-600 font-semibold">✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Change Password</h2>
        {pwMessage.text && (
          <div className={`mb-3 p-2 rounded-lg text-xs font-medium ${pwMessage.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
            {pwMessage.text}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
          </div>
          <button onClick={handleChangePassword} disabled={pwSaving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
