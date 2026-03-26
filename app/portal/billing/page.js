'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  voided: { label: 'Voided', color: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 line-through' },
}

export default function BillingPage() {
  const { profile, isFinanceStaff, isDirector, hasPermission } = useAuth()
  const [token, setToken] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [summary, setSummary] = useState({ totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, totalOverdue: 0, invoiceCount: 0 })
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices' | 'time' | 'overview'

  // Time tracking from case metadata
  const [metadataMap, setMetadataMap] = useState({})

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    caseId: '', caseNumber: '', clientName: '', clientEmail: '',
    dueDate: '', notes: '', taxRate: 15,
    lineItems: [{ description: '', quantity: 1, rate: 0 }],
  })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [billRes, casesRes] = await Promise.allSettled([
        fetch('/api/billing', { headers }),
        fetch('/api/cases', { headers }),
      ])

      if (billRes.status === 'fulfilled' && billRes.value.ok) {
        const d = await billRes.value.json()
        setInvoices(d.invoices || [])
        setSummary(d.summary || {})
      }

      if (casesRes.status === 'fulfilled' && casesRes.value.ok) {
        const d = await casesRes.value.json()
        const allCases = d.cases || []
        setCases(allCases)

        // Fetch metadata for time tracking overview
        const map = {}
        await Promise.all(allCases.slice(0, 30).map(async c => {
          try {
            const mRes = await fetch(`/api/cases/${c.id}/metadata`, { headers })
            if (mRes.ok) { const md = await mRes.json(); map[c.id] = md.metadata }
          } catch { /* ignore */ }
        }))
        setMetadataMap(map)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // Calculate time tracking totals
  let totalHoursTracked = 0, totalBudget = 0, totalEstHours = 0
  Object.values(metadataMap).forEach(m => {
    if (m?.resources?.estimatedHours) totalEstHours += m.resources.estimatedHours
    if (m?.resources?.budgetAllocated) totalBudget += m.resources.budgetAllocated
    if (m?.timeEntries) totalHoursTracked += m.timeEntries.reduce((s, e) => s + (e.hours || 0), 0)
  })

  const filteredInvoices = filter === 'all' ? invoices : invoices.filter(inv => inv.status === filter)

  const addLineItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }],
    }))
  }

  const removeLineItem = (index) => {
    setInvoiceForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  const updateLineItem = (index, field, value) => {
    setInvoiceForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }))
  }

  const lineSubtotal = invoiceForm.lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const lineTax = lineSubtotal * (invoiceForm.taxRate / 100)
  const lineTotal = lineSubtotal + lineTax

  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    if (invoiceForm.lineItems.length === 0) return
    setCreateLoading(true)
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(invoiceForm),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setInvoiceForm({
          caseId: '', caseNumber: '', clientName: '', clientEmail: '',
          dueDate: '', notes: '', taxRate: 15,
          lineItems: [{ description: '', quantity: 1, rate: 0 }],
        })
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleInvoiceAction = async (id, action) => {
    try {
      await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action }),
      })
      fetchData()
      setSelectedInvoice(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Billing & Finance</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Invoicing, time tracking, and financial management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            {['invoices', 'time', 'overview'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${activeTab === t ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Invoiced', value: `R${(summary.totalInvoiced || 0).toLocaleString()}`, icon: '📊', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Paid', value: `R${(summary.totalPaid || 0).toLocaleString()}`, icon: '✅', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Outstanding', value: `R${(summary.totalOutstanding || 0).toLocaleString()}`, icon: '⏳', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Hours Tracked', value: `${totalHoursTracked.toFixed(1)}h`, icon: '🕐', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Budget Allocated', value: `R${totalBudget.toLocaleString()}`, icon: '💰', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-current/5`}>
            <div className="flex items-center justify-between">
              <span className="text-lg">{s.icon}</span>
              <span className="text-lg font-display font-bold text-infinity-navy dark:text-white">{loading ? '—' : s.value}</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <>
          {/* Status Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'draft', 'sent', 'paid', 'overdue', 'voided'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && <span className="ml-1 opacity-60">({invoices.filter(i => i.status === s).length})</span>}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Invoice List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-sm text-gray-400"><div className="w-5 h-5 border-2 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />Loading...</div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-gray-400">No invoices found</p>
                    <button onClick={() => setShowCreateModal(true)} className="mt-2 text-xs text-infinity-gold font-semibold hover:underline">+ Create your first invoice</button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredInvoices.map(inv => (
                      <div key={inv.id} onClick={() => setSelectedInvoice(inv)}
                        className={`flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${selectedInvoice?.id === inv.id ? 'bg-infinity-gold/5 border-l-4 border-l-infinity-gold' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-infinity-navy dark:text-white">{inv.invoiceNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${INVOICE_STATUSES[inv.status]?.color || ''}`}>
                              {INVOICE_STATUSES[inv.status]?.label || inv.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {inv.clientName || 'No client'}{inv.caseNumber ? ` • ${inv.caseNumber}` : ''}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-infinity-navy dark:text-white">R{(inv.totalAmount || 0).toLocaleString()}</div>
                          {inv.dueDate && <div className="text-[10px] text-gray-400">Due: {new Date(inv.dueDate).toLocaleDateString('en-ZA')}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Detail Panel */}
            <div>
              {selectedInvoice ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-display font-bold text-infinity-navy dark:text-white">{selectedInvoice.invoiceNumber}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${INVOICE_STATUSES[selectedInvoice.status]?.color}`}>
                        {INVOICE_STATUSES[selectedInvoice.status]?.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Client</span><span className="font-medium text-infinity-navy dark:text-white">{selectedInvoice.clientName || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Case</span><span className="font-medium text-infinity-navy dark:text-white">{selectedInvoice.caseNumber || '—'}</span></div>
                    {selectedInvoice.issuedDate && <div className="flex justify-between"><span className="text-gray-400">Issued</span><span>{new Date(selectedInvoice.issuedDate).toLocaleDateString('en-ZA')}</span></div>}
                    {selectedInvoice.dueDate && <div className="flex justify-between"><span className="text-gray-400">Due Date</span><span>{new Date(selectedInvoice.dueDate).toLocaleDateString('en-ZA')}</span></div>}
                    {selectedInvoice.paidDate && <div className="flex justify-between"><span className="text-gray-400">Paid</span><span className="text-green-600 font-semibold">{new Date(selectedInvoice.paidDate).toLocaleDateString('en-ZA')}</span></div>}
                  </div>

                  {/* Line Items */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">Line Items</h4>
                    {(selectedInvoice.lineItems || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs py-1">
                        <span className="text-infinity-navy dark:text-white">{item.description || 'Item'}</span>
                        <span className="text-gray-500">{item.quantity} × R{item.rate} = <span className="font-semibold">R{(item.amount || 0).toLocaleString()}</span></span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>R{(selectedInvoice.subtotal || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">VAT ({selectedInvoice.taxRate || 15}%)</span><span>R{(selectedInvoice.taxAmount || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-sm text-infinity-navy dark:text-white"><span>Total</span><span>R{(selectedInvoice.totalAmount || 0).toLocaleString()}</span></div>
                    </div>
                  </div>

                  {selectedInvoice.notes && (
                    <div className="text-xs text-gray-400 italic">{selectedInvoice.notes}</div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {selectedInvoice.status === 'draft' && (
                      <button onClick={() => handleInvoiceAction(selectedInvoice.id, 'send')}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">Send Invoice</button>
                    )}
                    {selectedInvoice.status === 'sent' && hasPermission('APPROVE_BILLING') && (
                      <button onClick={() => handleInvoiceAction(selectedInvoice.id, 'mark_paid')}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">Mark Paid</button>
                    )}
                    {['draft', 'sent'].includes(selectedInvoice.status) && hasPermission('APPROVE_BILLING') && (
                      <button onClick={() => handleInvoiceAction(selectedInvoice.id, 'void')}
                        className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">Void</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <div className="text-3xl mb-2">📑</div>
                  <p className="text-sm text-gray-400">Select an invoice to view details</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TIME TRACKING TAB */}
      {activeTab === 'time' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white">Time Tracking by Case</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Case</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Type</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Est. Hours</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Hours Used</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Budget</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {cases.map(c => {
                    const m = metadataMap[c.id]
                    const estH = m?.resources?.estimatedHours || 0
                    const usedH = m?.timeEntries?.reduce((s, e) => s + (e.hours || 0), 0) || 0
                    const budget = m?.resources?.budgetAllocated || 0
                    const pct = estH > 0 ? Math.round((usedH / estH) * 100) : 0
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2.5 font-medium text-infinity-navy dark:text-white">{c.case_number || 'Case'}</td>
                        <td className="px-4 py-2.5 text-gray-500 capitalize">{c.case_type}</td>
                        <td className="px-4 py-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{c.status}</span></td>
                        <td className="px-4 py-2.5 text-right">{estH || '—'}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{usedH || '—'}</td>
                        <td className="px-4 py-2.5 text-right">{budget ? `R${budget.toLocaleString()}` : '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          {estH > 0 ? (
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                              <span className={`font-semibold ${pct > 100 ? 'text-red-600' : ''}`}>{pct}%</span>
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by Month (placeholder) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">Revenue Collected</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">R{(summary.totalPaid || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">Total Billed</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-400">R{(summary.totalInvoiced || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">Outstanding</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">R{(summary.totalOutstanding || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <span className="text-sm text-red-700 dark:text-red-400 font-medium">Overdue</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">R{(summary.totalOverdue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Collection Rate</span>
                  <span className="font-bold text-infinity-navy dark:text-white">
                    {summary.totalInvoiced > 0 ? Math.round((summary.totalPaid / summary.totalInvoiced) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${summary.totalInvoiced > 0 ? (summary.totalPaid / summary.totalInvoiced) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Time Utilization</span>
                  <span className="font-bold text-infinity-navy dark:text-white">
                    {totalEstHours > 0 ? Math.round((totalHoursTracked / totalEstHours) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${totalEstHours > 0 ? Math.min(100, (totalHoursTracked / totalEstHours) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-xl font-bold text-infinity-navy dark:text-white">{invoices.length}</div>
                  <div className="text-[10px] text-gray-400">Total Invoices</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-xl font-bold text-infinity-navy dark:text-white">{cases.length}</div>
                  <div className="text-[10px] text-gray-400">Active Cases</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">New Invoice</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Client Name *</label>
                  <input type="text" required value={invoiceForm.clientName} onChange={e => setInvoiceForm(p => ({ ...p, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Client name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Client Email</label>
                  <input type="email" value={invoiceForm.clientEmail} onChange={e => setInvoiceForm(p => ({ ...p, clientEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="client@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Case Reference</label>
                  <select value={invoiceForm.caseId} onChange={e => {
                    const c = cases.find(cs => cs.id === e.target.value)
                    setInvoiceForm(p => ({ ...p, caseId: e.target.value, caseNumber: c?.case_number || '' }))
                  }} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    <option value="">No case linked</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.case_number || c.case_subtype || 'Case'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Due Date</label>
                  <input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500">Line Items</label>
                  <button type="button" onClick={addLineItem} className="text-xs text-infinity-gold font-semibold hover:underline">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {invoiceForm.lineItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input type="text" value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Description" />
                      <input type="number" min="0.5" step="0.5" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-center bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Qty" />
                      <input type="number" min="0" value={item.rate} onChange={e => updateLineItem(i, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-right bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" placeholder="Rate (R)" />
                      <div className="w-24 py-2 text-right text-sm font-medium text-infinity-navy dark:text-white">R{(item.quantity * item.rate).toLocaleString()}</div>
                      {invoiceForm.lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(i)} className="py-2 text-red-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1 text-sm text-right">
                  <div className="flex justify-end gap-8"><span className="text-gray-400">Subtotal</span><span className="w-28">R{lineSubtotal.toLocaleString()}</span></div>
                  <div className="flex justify-end gap-8 items-center">
                    <span className="text-gray-400">VAT</span>
                    <input type="number" min="0" max="100" value={invoiceForm.taxRate} onChange={e => setInvoiceForm(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-1 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-center bg-white dark:bg-gray-700" />
                    <span className="w-28">R{lineTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-end gap-8 font-bold text-infinity-navy dark:text-white"><span>Total</span><span className="w-28">R{lineTotal.toLocaleString()}</span></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                <textarea rows={2} value={invoiceForm.notes} onChange={e => setInvoiceForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none" placeholder="Payment terms, bank details, etc." />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={createLoading}
                  className="flex-1 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  {createLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
