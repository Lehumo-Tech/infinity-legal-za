'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchDashboardData()

      const caseChannel = supabase
        .channel(`client-cases:${user.id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'cases',
          filter: `client_id=eq.${user.id}`
        }, () => {
          fetchDashboardData()
        })
        .subscribe()

      // Real-time messages
      const msgChannel = supabase
        .channel(`client-messages:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages'
        }, (payload) => {
          if (selectedCase && payload.new.case_id === selectedCase.id) {
            loadMessages(selectedCase.id)
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(caseChannel)
        supabase.removeChannel(msgChannel)
      }
    }
  }, [authLoading, user, selectedCase])

  const fetchDashboardData = async () => {
    try {
      const { data: casesData } = await supabase
        .from('cases')
        .select('*, attorney:attorneys(id, full_name, specializations)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      setCases(casesData || [])

      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*, pricing_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      setSubscription(subData)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
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
      content_encrypted: newMessage, // Matches schema content_encrypted
      created_at: new Date().toISOString()
    })

    setNewMessage('')
    loadMessages(selectedCase.id)
  }

  async function summarizeSelectedCase() {
    if (!selectedCase) return
    setSummarizing(true)
    setSummary('')

    try {
      const textToSummarize = selectedCase.intake_data
        ? selectedCase.intake_data.join('\n\n')
        : selectedCase.ai_analysis?.disclaimer
          ? `${selectedCase.category}. ${selectedCase.subcategory}`
          : ''

      if (!textToSummarize || textToSummarize.length < 50) {
        setSummary('Not enough text to summarize. Add more case details.')
        setSummarizing(false)
        return
      }

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSummarize, maxLength: 150, minLength: 30 }),
      })

      const data = await res.json()
      if (data.success) {
        setSummary(data.summary)
      } else {
        setSummary('Summary unavailable. ' + (data.error || ''))
      }
    } catch (err) {
      setSummary('Could not generate summary. Please try again.')
    } finally {
      setSummarizing(false)
    }
  }

  function getStatusColor(status) {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.open
  }

  function getUrgencyBadge(urgency) {
    const badges = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    }
    return badges[urgency] || urgency
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-infinity-navy mx-auto mb-4"></div>
          <p className="text-infinity-navy">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-infinity-cream">
      <nav className="bg-white border-b border-infinity-gold/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-14 w-auto rounded-xl" />
              <span className="font-bold text-xl text-infinity-navy">My Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <span className="text-sm text-infinity-navy/70">{profile?.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-infinity-navy/70 hover:text-infinity-navy"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Welcome, {profile?.full_name || 'there'}!</h1>
          <p className="text-infinity-navy/70">Manage your legal matters</p>
        </div>

        {/* Subscription Card */}
        {subscription ? (
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-infinity-navy mb-2">
                  {subscription.pricing_plans?.name} Plan
                </h2>
                <p className="text-infinity-navy/70">
                  {subscription.credits_remaining} consultation credits remaining
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-infinity-gold">
                  R{subscription.pricing_plans?.price_zar}/month
                </div>
                <Link href="/pricing" className="text-sm text-infinity-navy hover:underline">
                  Change Plan
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-amber-900 mb-2">No Active Subscription</h3>
            <p className="text-sm text-amber-800 mb-4">
              Subscribe to get consultation credits and access premium features.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-2 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90"
            >
              View Plans
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/intake"
            className="bg-white rounded-lg border border-infinity-gold/20 p-6 hover:border-infinity-gold transition-all"
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-semibold text-infinity-navy mb-2">New Legal Issue</h3>
            <p className="text-sm text-infinity-navy/70">Start AI intake wizard</p>
          </Link>

          <Link
            href="/book-consultation"
            className="bg-white rounded-lg border border-infinity-gold/20 p-6 hover:border-infinity-gold transition-all"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-semibold text-infinity-navy mb-2">Book Consultation</h3>
            <p className="text-sm text-infinity-navy/70">Schedule with attorney</p>
          </Link>

          <Link
            href="/pricing"
            className="bg-white rounded-lg border border-infinity-gold/20 p-6 hover:border-infinity-gold transition-all"
          >
            <div className="text-4xl mb-3">⚖️</div>
            <h3 className="font-semibold text-infinity-navy mb-2">Subscription Plans</h3>
            <p className="text-sm text-infinity-navy/70">View available plans</p>
          </Link>
        </div>

        {/* Cases & Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cases List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg text-infinity-navy">Cases ({cases.length})</h2>
              <button
                onClick={() => router.push('/intake')}
                className="px-4 py-2 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90 text-sm"
              >
                + New Case
              </button>
            </div>

            {cases.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-infinity-gold/20 rounded-xl p-8 text-center">
                <p className="text-infinity-navy/70 mb-4">No cases yet</p>
                <button
                  onClick={() => router.push('/intake')}
                  className="text-infinity-navy hover:underline"
                >
                  Start your first legal intake
                </button>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-infinity-navy/50">
                      {getUrgencyBadge(c.urgency)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-infinity-navy">{c.category}</h3>
                  <p className="text-sm text-infinity-navy/70 mt-1">{c.subcategory}</p>
                  {c.attorney && (
                    <p className="text-sm text-blue-600 mt-2">
                      Attorney: {c.attorney.full_name}
                    </p>
                  )}
                  <p className="text-xs text-infinity-navy/40 mt-2">
                    {new Date(c.created_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Case Detail & Messages */}
          <div className="lg:col-span-2">
            {selectedCase ? (
              <div className="space-y-6">
                {/* Case Header */}
                <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-infinity-navy">{selectedCase.category}</h2>
                      <p className="text-infinity-navy/70">{selectedCase.subcategory}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status.replace('_', ' ')}
                    </span>
                  </div>

                  {selectedCase.ai_analysis && (
                    <div className="mt-4 p-4 bg-infinity-cream rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm text-infinity-navy">AI Analysis</h3>
                        <button
                          onClick={summarizeSelectedCase}
                          disabled={summarizing}
                          className="text-xs px-3 py-1 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90 disabled:opacity-50"
                        >
                          {summarizing ? 'Summarizing...' : 'Summarize'}
                        </button>
                      </div>
                      <p className="text-sm text-infinity-navy/70">
                        <strong>Estimated Cost:</strong> {selectedCase.ai_analysis.costEstimate?.range || 'TBD'}
                      </p>
                      <div className="mt-2">
                        <strong className="text-sm text-infinity-navy">Next Steps:</strong>
                        <ol className="mt-1 text-sm text-infinity-navy/70 list-decimal list-inside">
                          {(selectedCase.ai_analysis.nextSteps || []).map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      {summary && (
                        <div className="mt-3 p-3 bg-white border border-infinity-gold/20 rounded-lg">
                          <strong className="text-xs text-infinity-navy">Case Summary:</strong>
                          <p className="text-sm text-infinity-navy/70 mt-1">{summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 text-infinity-navy">Messages</h3>

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
                            <p className="text-sm">{msg.content_encrypted}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-200' : 'text-infinity-navy/50'}`}>
                              {msg.sender?.full_name} &middot; {new Date(msg.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
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

                {/* Documents */}
                <div className="bg-white border border-infinity-gold/20 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 text-infinity-navy">Documents</h3>
                  <DocumentUploader caseId={selectedCase.id} userId={user.id} />
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-infinity-gold/20 rounded-xl p-12 text-center">
                <p className="text-infinity-navy/50 text-lg">Select a case to view details and messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentUploader({ caseId, userId }) {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    loadDocuments()
  }, [caseId])

  async function loadDocuments() {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const key = `cases/${caseId}/${Date.now()}-${file.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(key, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(key)

      await supabase.from('documents').insert({
        case_id: caseId,
        uploaded_by: userId,
        file_name: file.name,
        file_path: key,
        file_type: file.type,
        file_size_bytes: file.size
      })

      loadDocuments()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-infinity-cream text-infinity-navy rounded-lg cursor-pointer hover:bg-amber-100 w-fit border border-infinity-gold/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" />
        </label>
        <p className="text-xs text-infinity-navy/50 mt-1">Max 10MB. PDF, Word, images accepted.</p>
      </div>

      {documents.length === 0 ? (
        <p className="text-infinity-navy/50 text-sm">No documents uploaded yet</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <a
              key={doc.id}
              href={`#`}
              onClick={(e) => {
                e.preventDefault();
                supabase.storage.from('documents').download(doc.file_path).then(({data}) => {
                  if (data) {
                    const url = window.URL.createObjectURL(data);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.file_name;
                    a.click();
                  }
                });
              }}
              className="flex items-center gap-3 p-3 bg-infinity-cream rounded-lg hover:bg-amber-100 transition-colors"
            >
              <svg className="w-8 h-8 text-infinity-navy/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-infinity-navy truncate">{doc.file_name}</p>
                <p className="text-xs text-infinity-navy/50">{(doc.file_size_bytes / 1024).toFixed(1)} KB &middot; {new Date(doc.created_at).toLocaleDateString('en-ZA')}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
