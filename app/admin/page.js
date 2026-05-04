'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export default function AdminPanelPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [tab, setTab] = useState('attorneys')
  const [attorneys, setAttorneys] = useState([])
  const [cases, setCases] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user && (profile?.role === 'admin' || profile?.role === 'managing_director')) {
      loadAllData()
    } else if (user && !authLoading) {
      router.push('/dashboard')
    }
  }, [authLoading, user, profile])

  async function loadAllData() {
    await Promise.all([loadAttorneys(), loadCases(), loadAuditLogs(), loadStats()])
    setLoading(false)
  }

  async function loadAttorneys() {
    const { data } = await supabaseAdmin
      .from('attorneys')
      .select('*, profiles(email, full_name, phone, created_at)')
      .order('created_at', { ascending: false })
    setAttorneys(data || [])
  }

  async function loadCases() {
    const { data } = await supabaseAdmin
      .from('cases')
      .select('*, client:profiles!cases_client_id_fkey(full_name, email), attorney:attorneys(full_name)')
      .order('created_at', { ascending: false })
    setCases(data || [])
  }

  async function loadAuditLogs() {
    const { data } = await supabaseAdmin
      .from('audit_logs')
      .select('*, admin:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setAuditLogs(data || [])
  }

  async function loadStats() {
    const { data: attorneyStats } = await supabaseAdmin
      .from('attorneys')
      .select('status')
    const { data: caseStats } = await supabaseAdmin
      .from('cases')
      .select('status, urgency')

    setStats({
      totalAttorneys: attorneyStats?.length || 0,
      verifiedAttorneys: attorneyStats?.filter(a => a.status === 'verified').length || 0,
      pendingAttorneys: attorneyStats?.filter(a => a.status === 'unverified').length || 0,
      totalCases: caseStats?.length || 0,
      openCases: caseStats?.filter(c => c.status === 'open').length || 0,
      criticalCases: caseStats?.filter(c => c.urgency === 'critical').length || 0
    })
  }

  async function verifyAttorney(attorneyId) {
    await supabaseAdmin.from('attorneys').update({
      status: 'verified', verified_at: new Date().toISOString()
    }).eq('id', attorneyId)

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id, action: 'verify_attorney',
      target_type: 'attorney', target_id: attorneyId,
      details: { previous_status: 'unverified' },
      created_at: new Date().toISOString()
    })

    loadAttorneys()
    loadStats()
  }

  async function assignCase(caseId, attorneyId) {
    await supabaseAdmin.from('cases').update({
      attorney_id: attorneyId, status: 'assigned', assigned_at: new Date().toISOString()
    }).eq('id', caseId)

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id, action: 'assign_case',
      target_type: 'case', target_id: caseId,
      details: { attorney_id: attorneyId },
      created_at: new Date().toISOString()
    })

    loadCases()
    loadStats()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-infinity-navy mx-auto mb-4"></div>
          <p className="text-infinity-navy">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'managing_director')) {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-infinity-navy mb-4">Admin access required.</p>
          <Link href="/" className="px-6 py-2 bg-infinity-navy text-infinity-cream rounded-lg">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-infinity-cream">
      <nav className="bg-white border-b border-infinity-gold/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-14 w-auto rounded-xl" />
              <span className="font-bold text-xl text-infinity-navy">Admin Panel</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-infinity-navy/70">{profile?.full_name}</span>
              <button onClick={signOut} className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-infinity-navy mb-2">Platform Management</h1>
        <p className="text-infinity-navy/70 mb-6">Attorney verification, case oversight, and audit logs</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Attorneys', value: stats.totalAttorneys, color: 'text-infinity-navy' },
            { label: 'Verified', value: stats.verifiedAttorneys, color: 'text-green-600' },
            { label: 'Pending', value: stats.pendingAttorneys, color: 'text-yellow-600' },
            { label: 'Total Cases', value: stats.totalCases, color: 'text-infinity-navy' },
            { label: 'Open', value: stats.openCases, color: 'text-blue-600' },
            { label: 'Critical', value: stats.criticalCases, color: 'text-red-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-infinity-gold/20 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-infinity-navy/70">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-infinity-gold/20">
          {['attorneys', 'cases', 'audit'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium capitalize ${
                tab === t
                  ? 'text-infinity-gold border-b-2 border-infinity-gold'
                  : 'text-infinity-navy/70 hover:text-infinity-navy'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Attorneys Tab */}
        {tab === 'attorneys' && (
          <div className="bg-white border border-infinity-gold/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-infinity-cream">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">LPC Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Specializations</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attorneys.map(a => (
                  <tr key={a.id} className="border-t border-infinity-gold/10">
                    <td className="px-4 py-3">
                      <p className="font-medium text-infinity-navy">{a.profiles?.full_name}</p>
                      <p className="text-xs text-infinity-navy/50">{a.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-infinity-navy">{a.lpc_number}</td>
                    <td className="px-4 py-3 text-infinity-navy">{a.specializations?.join(', ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === 'verified' ? 'bg-green-100 text-green-800' :
                        a.status === 'unverified' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'unverified' && (
                        <button
                          onClick={() => verifyAttorney(a.id)}
                          className="px-3 py-1 bg-infinity-navy text-infinity-cream rounded-lg text-xs hover:bg-infinity-navy/90"
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cases Tab */}
        {tab === 'cases' && (
          <div className="bg-white border border-infinity-gold/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-infinity-cream">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Urgency</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Assign To</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="border-t border-infinity-gold/10">
                    <td className="px-4 py-3">
                      <p className="font-medium text-infinity-navy">{c.category}</p>
                      <p className="text-xs text-infinity-navy/50">{c.subcategory}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-infinity-navy">{c.client?.full_name}</p>
                      <p className="text-xs text-infinity-navy/50">{c.client?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                        c.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        c.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-infinity-navy">{c.status.replace('_', ' ')}</span>
                      {c.attorney && <p className="text-xs text-blue-600">{c.attorney.full_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {!c.attorney_id && (
                        <select
                          onChange={(e) => e.target.value && assignCase(c.id, e.target.value)}
                          className="text-xs border border-infinity-gold/30 rounded-lg px-2 py-1 bg-white"
                          defaultValue=""
                        >
                          <option value="">Select attorney...</option>
                          {attorneys.filter(a => a.status === 'verified').map(a => (
                            <option key={a.id} value={a.id}>{a.profiles?.full_name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Tab */}
        {tab === 'audit' && (
          <div className="bg-white border border-infinity-gold/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-infinity-cream">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Admin</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Target</th>
                  <th className="px-4 py-3 text-left font-semibold text-infinity-navy">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-t border-infinity-gold/10">
                    <td className="px-4 py-3 text-xs text-infinity-navy/50">
                      {new Date(log.created_at).toLocaleString('en-ZA')}
                    </td>
                    <td className="px-4 py-3 text-infinity-navy">{log.admin?.full_name || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-infinity-cream rounded text-xs text-infinity-navy">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-infinity-navy">{log.target_type} &middot; {log.target_id?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-xs text-infinity-navy/70">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
