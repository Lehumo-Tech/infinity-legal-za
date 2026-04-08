'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SettingsPage() {
  const { profile, role, roleLabel, department } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState(null)
  const [exportError, setExportError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  const handleExportData = async () => {
    setExporting(true)
    setExportError('')
    setExportResult(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        setExportError('You must be logged in to export your data.')
        return
      }

      const res = await fetch('/api/user/export', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to export data')
      }

      const data = await res.json()

      // Trigger download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `infinity_legal_data_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportResult(data.summary)
    } catch (error) {
      setExportError(error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Settings</h1>
        <p className="text-sm text-infinity-navy/50 dark:text-white/40 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {['profile', 'privacy', 'notifications'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors capitalize ${
            activeTab === tab ? 'bg-white dark:bg-gray-700 text-infinity-navy dark:text-white shadow-sm' : 'text-gray-500 hover:text-infinity-navy dark:hover:text-white'
          }`}>{tab}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Account Information</h2>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-infinity-navy dark:text-white">{profile?.full_name || '—'}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-infinity-navy dark:text-white">{profile?.email || '—'}</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-infinity-navy dark:text-white">{roleLabel || '—'}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-infinity-navy dark:text-white">{department || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Plan Status</h2>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Free Tier Active
              </span>
            </div>
            <p className="text-xs text-gray-500">You are currently on the free tier. <Link href="/pricing" className="text-infinity-gold font-bold hover:underline">Upgrade to a premium plan →</Link></p>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          {/* POPIA Data Export */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-infinity-navy/10 dark:bg-infinity-navy/30 flex items-center justify-center text-xl">📋</div>
              <div>
                <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white">Export My Data (POPIA)</h2>
                <p className="text-xs text-gray-500 mt-0.5">Download a copy of all your personal data stored on our platform, in compliance with POPIA Section 23 (Right of Access).</p>
              </div>
            </div>

            <button onClick={handleExportData} disabled={exporting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Preparing Export...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export My Data
                </>
              )}
            </button>

            {exportError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                <p className="text-xs text-red-700 dark:text-red-400">{exportError}</p>
              </div>
            )}

            {exportResult && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                <p className="text-xs text-green-700 dark:text-green-400 font-bold mb-1">Export downloaded successfully!</p>
                <div className="text-xs text-green-600 dark:text-green-500 space-y-0.5">
                  <p>Cases: {exportResult.totalCases} | Tasks: {exportResult.totalTasks} | Notes: {exportResult.totalNotes}</p>
                  <p>Messages: {exportResult.totalMessages} | Documents: {exportResult.totalDocuments} | Intakes: {exportResult.totalIntakes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">Your Privacy Rights (POPIA)</h2>
            <div className="space-y-2">
              {[
                { right: 'Right of Access', desc: 'You can request a copy of all personal data we hold about you.' },
                { right: 'Right to Rectification', desc: 'You can request correction of inaccurate personal data.' },
                { right: 'Right to Erasure', desc: 'You can request deletion of your personal data, subject to legal retention requirements.' },
                { right: 'Right to Object', desc: 'You can object to the processing of your personal information.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-infinity-gold text-xs mt-0.5">●</span>
                  <div>
                    <span className="text-xs font-bold text-infinity-navy dark:text-white">{item.right}:</span>
                    <span className="text-xs text-gray-500 ml-1">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">For privacy-related requests, contact: <a href="mailto:legal@infinitylegal.org" className="text-infinity-gold hover:underline">legal@infinitylegal.org</a></p>
            <Link href="/privacy" className="inline-block mt-2 text-xs text-infinity-gold font-semibold hover:underline">View Full Privacy Policy →</Link>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { label: 'Case Status Updates', desc: 'Receive notifications when your case status changes', defaultOn: true },
              { label: 'Task Reminders', desc: 'Get reminded about upcoming deadlines', defaultOn: true },
              { label: 'New Messages', desc: 'Notifications for new messages from your team', defaultOn: true },
              { label: 'Platform Announcements', desc: 'Updates about new features and platform changes', defaultOn: false },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <div className="text-xs font-semibold text-infinity-navy dark:text-white">{pref.label}</div>
                  <div className="text-[10px] text-gray-400">{pref.desc}</div>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked={pref.defaultOn} className="sr-only peer" id={`pref-${i}`} />
                  <label htmlFor={`pref-${i}`} className="block w-9 h-5 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer peer-checked:bg-infinity-gold transition-colors">
                    <span className="block w-4 h-4 bg-white rounded-full shadow mt-0.5 ml-0.5 peer-checked:ml-4.5 transition-all" />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Notification preferences are stored locally. Email notification settings coming soon.</p>
        </div>
      )}
    </div>
  )
}
