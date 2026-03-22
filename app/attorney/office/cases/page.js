'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCases()
  }, [filter])

  const fetchCases = async () => {
    // Mock data - will connect to Supabase
    const mockCases = [
      {
        id: '1',
        caseNumber: 'INF-2025-1234',
        clientName: 'John Doe',
        title: 'Unfair Dismissal',
        caseType: 'Labour Law',
        status: 'active',
        urgency: 'high',
        courtDate: '2025-04-15',
        lastActivity: '2 hours ago'
      },
      {
        id: '2',
        caseNumber: 'INF-2025-1233',
        clientName: 'Jane Smith',
        title: 'Divorce Proceedings',
        caseType: 'Family Law',
        status: 'active',
        urgency: 'medium',
        courtDate: '2025-05-20',
        lastActivity: '1 day ago'
      },
      {
        id: '3',
        caseNumber: 'INF-2025-1232',
        clientName: 'Mike Johnson',
        title: 'Contract Dispute',
        caseType: 'Commercial Law',
        status: 'pending',
        urgency: 'low',
        courtDate: null,
        lastActivity: '3 days ago'
      },
      {
        id: '4',
        caseNumber: 'INF-2025-1231',
        clientName: 'Sarah Williams',
        title: 'Criminal Assault Charge',
        caseType: 'Criminal Law',
        status: 'active',
        urgency: 'emergency',
        courtDate: '2025-03-25',
        lastActivity: '10 mins ago'
      }
    ]

    setCases(mockCases)
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-infinity-gold/10 text-infinity-navy border-infinity-gold/20'
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'closed': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCourtDateCountdown = (courtDate) => {
    if (!courtDate) return null
    const today = new Date()
    const court = new Date(courtDate)
    const diffTime = court - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Past', color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Today!', color: 'text-red-600 font-bold' }
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-orange-600 font-bold' }
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-orange-600' }
    return { text: `${diffDays} days`, color: 'text-infinity-navy/70' }
  }

  const filteredCases = cases.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (searchQuery && !c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.clientName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-infinity-cream">
      {/* Navigation */}
      <nav className="bg-white border-b border-infinity-gold/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/attorney/office" className="flex items-center gap-3">
              <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
              <span className="font-bold text-xl text-infinity-navy">Attorney Office</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/attorney/office" className="text-infinity-navy/70 hover:text-infinity-navy">Dashboard</Link>
              <Link href="/attorney/office/cases" className="text-infinity-navy font-medium border-b-2 border-infinity-gold pb-1">Cases</Link>
              <Link href="/attorney/office/documents" className="text-infinity-navy/70 hover:text-infinity-navy">Documents</Link>
              <Link href="/attorney/office/tasks" className="text-infinity-navy/70 hover:text-infinity-navy">Tasks</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-infinity-navy mb-2">Case Management</h1>
            <p className="text-infinity-navy/70">Manage and track all your legal cases</p>
          </div>
          <button
            onClick={() => router.push('/attorney/office/cases/new')}
            className="px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90"
          >
            + New Case
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg p-6 border border-infinity-gold/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by case number or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
            />
            
            <div className="flex gap-2">
              {['all', 'active', 'pending', 'closed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${filter === f
                      ? 'bg-infinity-navy text-infinity-cream'
                      : 'bg-infinity-cream text-infinity-navy hover:bg-infinity-gold/10'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-lg border border-infinity-gold/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-infinity-cream">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Case Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Urgency</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Court Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-infinity-navy">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c, i) => {
                const countdown = getCourtDateCountdown(c.courtDate)
                return (
                  <tr key={c.id} className={`border-t border-infinity-gold/10 hover:bg-infinity-cream/50 cursor-pointer`}
                    onClick={() => router.push(`/attorney/office/cases/${c.id}`)}>
                    <td className="px-6 py-4 font-mono text-sm text-infinity-navy">{c.caseNumber}</td>
                    <td className="px-6 py-4 text-infinity-navy">{c.clientName}</td>
                    <td className="px-6 py-4 text-infinity-navy">{c.title}</td>
                    <td className="px-6 py-4 text-sm text-infinity-navy/70">{c.caseType}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(c.urgency)}`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.courtDate ? (
                        <div>
                          <div className="text-sm text-infinity-navy">{c.courtDate}</div>
                          {countdown && <div className={`text-xs ${countdown.color}`}>{countdown.text}</div>}
                        </div>
                      ) : (
                        <span className="text-sm text-infinity-navy/50">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/attorney/office/cases/${c.id}`)
                        }}
                        className="text-infinity-navy hover:text-infinity-gold"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredCases.length === 0 && (
            <div className="p-12 text-center text-infinity-navy/50">
              No cases found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
