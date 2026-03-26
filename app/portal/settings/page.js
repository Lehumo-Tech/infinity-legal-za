'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const NOTIFICATION_GROUPS = [
  {
    title: 'Case & Legal',
    items: [
      { key: 'email_case_updates', label: 'Case updates', desc: 'New assignments, status changes, deadline alerts' },
      { key: 'email_task_assignments', label: 'Task notifications', desc: 'New tasks, completions, overdue reminders' },
      { key: 'email_document_workflow', label: 'Document workflow', desc: 'Review requests, approvals, rejections' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { key: 'push_messages', label: 'Direct messages', desc: 'New messages from colleagues' },
      { key: 'email_announcements', label: 'Firm announcements', desc: 'Company-wide updates and news' },
      { key: 'push_calendar_reminders', label: 'Calendar reminders', desc: 'Event and deadline reminders' },
    ],
  },
  {
    title: 'Finance & HR',
    items: [
      { key: 'email_billing_alerts', label: 'Billing alerts', desc: 'Invoice updates, payment notifications' },
      { key: 'email_leave_updates', label: 'Leave updates', desc: 'Leave request approvals and rejections' },
    ],
  },
]

export default function SettingsPage() {
  const { profile, user, roleLabel, department, refreshProfile } = useAuth()
  const [token, setToken] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' })

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({})
  const [notifLoading, setNotifLoading] = useState(true)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)
  const [digestFrequency, setDigestFrequency] = useState('daily')

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchNotifPrefs = useCallback(async () => {
    if (!token) return
    setNotifLoading(true)
    try {
      const res = await fetch('/api/settings/notifications', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        const prefs = d.preferences || {}
        setNotifPrefs(prefs)
        setDigestFrequency(prefs.digest_frequency || 'daily')
      }
    } catch (err) { console.error(err) }
    finally { setNotifLoading(false) }
  }, [token])

  useEffect(() => { fetchNotifPrefs() }, [fetchNotifPrefs])

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    setPwMessage({ type: '', text: '' })
    if (newPassword !== confirmPassword) { setPwMessage({ type: 'error', text: 'Passwords do not match' }); return }
    if (newPassword.length < 6) { setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwMessage({ type: 'success', text: 'Password updated successfully' })
      setNewPassword(''); setConfirmPassword('')
    } catch (err) { setPwMessage({ type: 'error', text: err.message || 'Failed to update password' }) }
    finally { setPwSaving(false) }
  }

  const toggleNotif = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    setNotifSaved(false)
    try {
      const prefs = { ...notifPrefs, digest_frequency: digestFrequency }
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: prefs }),
      })
      if (res.ok) {
        setNotifSaved(true)
        setTimeout(() => setNotifSaved(false), 3000)
      }
    } catch (err) { console.error(err) }
    finally { setNotifSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Settings</h1>
        <p className="text-sm text-infinity-navy/50 dark:text-white/40">Manage your profile, security, and preferences</p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
        {['profile', 'security', 'notifications'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors capitalize ${activeTab === t ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-14 h-14 bg-infinity-navy rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {profile?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="text-sm font-bold text-infinity-navy dark:text-white">{profile?.full_name || 'User'}</div>
                <div className="text-xs text-gray-400">{roleLabel} • {department}</div>
                <div className="text-[10px] text-gray-400">{user?.email}</div>
              </div>
            </div>

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
                className="px-5 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span className="text-xs text-green-600 font-semibold">✓ Profile updated</span>}
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="space-y-6">
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
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30 p-5">
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Security Best Practices</h3>
            <ul className="text-xs text-amber-600 dark:text-amber-400/80 space-y-1 list-disc pl-4">
              <li>Use a strong, unique password (12+ characters recommended)</li>
              <li>Never share your credentials with colleagues</li>
              <li>Lock your workstation when stepping away</li>
              <li>Report any suspicious activity to IT immediately</li>
            </ul>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">Loading preferences...</div>
          ) : (
            <>
              {NOTIFICATION_GROUPS.map((group, gi) => (
                <div key={gi} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white">{group.title}</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {group.items.map(item => (
                      <div key={item.key} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <div className="text-xs font-semibold text-infinity-navy dark:text-white">{item.label}</div>
                          <div className="text-[10px] text-gray-400">{item.desc}</div>
                        </div>
                        <button onClick={() => toggleNotif(item.key)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${notifPrefs[item.key] !== false ? 'bg-infinity-navy dark:bg-infinity-gold' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${notifPrefs[item.key] !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Email Digest */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">Email Digest Frequency</h3>
                <div className="flex gap-2">
                  {['realtime', 'daily', 'weekly', 'never'].map(f => (
                    <button key={f} onClick={() => setDigestFrequency(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${digestFrequency === f ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                      {f === 'realtime' ? 'Real-time' : f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleSaveNotifications} disabled={notifSaving}
                  className="px-5 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  {notifSaving ? 'Saving...' : 'Save Preferences'}
                </button>
                {notifSaved && <span className="text-xs text-green-600 font-semibold">✓ Preferences saved</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
