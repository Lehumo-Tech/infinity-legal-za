'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AttorneyDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/attorney/login')
      return
    }
    if (user && profile?.role === 'attorney') {
      loadCases()
      loadStats()

      const channel = supabase
        .channel(`attorney-cases:${user.id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'cases',
          filter: `attorney_id=eq.${user.id}`
        }, () => { loadCases(); loadStats() })
        .subscribe()

      return () => supabase.removeChannel(channel)
    }
  }, [authLoading, user, profile])

  async function loadCases() {
    if (!user) return
    const { data, error } = await supabase
      .from('cases')
      .select('*, client:profiles(id, full_name, email, phone)')
      .eq('attorney_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setCases(data || [])
    setLoading(false)
  }

  async function loadStats() {
    if (!user) return
    const { data } = await supabase
      .from('cases')
      .select('status')
      .eq('attorney_id', user.id)

    if (data) {
      setStats({
        total: data.length,
        open: data.filter(c => ['open', 'assigned', 'in_progress'].includes(c.status)).length,
        resolved: data.filter(c => c.status === 'resolved').length
      })
    }
  }

  async function loadMessages(caseId) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(full_name, role)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedCase || !user) return

    await supabase.from('messages').insert({
      case_id: selectedCase.id,
      sender_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString()
    })

    setNewMessage('')
    loadMessages(selectedCase.id)
  }

  async function updateCaseStatus(caseId, newStatus) {
    await supabase.from('cases').update({
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq('id', caseId)

    loadCases()
    if (selectedCase?.id === caseId) {
      setSelectedCase({ ...selectedCase, status: newStatus })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-infinity-navy mx-auto mb-4"></div>
          <p className="text-infinity-navy">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'attorney') {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-infinity-navy mb-4">Please sign in as an attorney to access this dashboard.</p>
          <Link href="/attorney/login" className="px-6 py-2 bg-infinity-navy text-infinity-cream rounded-lg">
            Attorney Login
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
              <span className="font-bold text-xl text-infinity-navy">Attorney Dashboard</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Welcome, {profile?.full_name || 'Attorney'}!</h1>
          <p className="text-infinity-navy/70">Manage your cases and client communications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
            <p className="text-sm text-infinity-navy/70">Total Cases</p>
            <p className="text-3xl font-bold text-infinity-navy">{stats.total}</p>
          </div>
          <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
            <p className="text-sm text-infinity-navy/70">Active Cases</p>
            <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
          </div>
          <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
            <p className="text-sm text-infinity-navy/70">Resolved</p>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cases List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-lg text-infinity-navy">My Cases</h2>

            {cases.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-infinity-gold/20 rounded-xl p-8 text-center">
                <p className="text-infinity-navy/70">No assigned cases yet</p>
              </div>
            ) : (
              cases.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCase(c); loadMessages(c.id); }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCase?.id === c.id
                      ? 'border-infinity-gold bg-amber-50'
                      : 'border-infinity-gold/20 hover:border-infinity-gold/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      c.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                      c.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-infinity-navy">{c.category}</h3>
                  <p className="text-sm text-infinity-navy/70">{c.client?.full_name}</p>
                  <p className="text-xs text-infinity-navy/50 mt-1">{c.client?.email}</p>
                </div>
              ))
            )}
          </div>

          {/* Case Detail */}
          <div className="lg:col-span-2">
            {selectedCase ? (
              <div className="space-y-6">
                {/* Case Info */}
                <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-infinity-navy">{selectedCase.category}</h2>
                      <p className="text-infinity-navy/70">{selectedCase.subcategory}</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedCase.status !== 'in_progress' && (
                        <button
                          onClick={() => updateCaseStatus(selectedCase.id, 'in_progress')}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                        >
                          Start Work
                        </button>
                      )}
                      {selectedCase.status !== 'resolved' && (
                        <button
                          onClick={() => updateCaseStatus(selectedCase.id, 'resolved')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-infinity-navy/70">Client</p>
                      <p className="font-medium text-infinity-navy">{selectedCase.client?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-infinity-navy/70">Contact</p>
                      <p className="font-medium text-infinity-navy">{selectedCase.client?.email}</p>
                    </div>
                    <div>
                      <p className="text-infinity-navy/70">Urgency</p>
                      <p className="font-medium capitalize text-infinity-navy">{selectedCase.urgency}</p>
                    </div>
                    <div>
                      <p className="text-infinity-navy/70">Cost Estimate</p>
                      <p className="font-medium text-infinity-navy">{selectedCase.cost_estimate?.range || 'TBD'}</p>
                    </div>
                  </div>

                  {selectedCase.intake_data && (
                    <div className="mt-4 p-4 bg-infinity-cream rounded-lg">
                      <h3 className="font-semibold text-sm mb-2 text-infinity-navy">Intake Responses</h3>
                      {selectedCase.intake_data.map((response, i) => (
                        <p key={i} className="text-sm text-infinity-navy/70 mb-1">Q{i+1}: {response}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 text-infinity-navy">Client Communication</h3>

                  <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                    {messages.length === 0 ? (
                      <p className="text-infinity-navy/50 text-center py-8">No messages yet</p>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-xl ${
                            msg.sender_id === user.id
                              ? 'bg-infinity-navy text-white'
                              : 'bg-infinity-cream text-infinity-navy'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-200' : 'text-infinity-navy/50'}`}>
                              {msg.sender?.full_name} &middot; {new Date(msg.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Reply to client..."
                      className="flex-1 px-4 py-2 border border-infinity-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-gold"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-6 py-2 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-infinity-gold/20 rounded-xl p-12 text-center">
                <p className="text-infinity-navy/50 text-lg">Select a case to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
