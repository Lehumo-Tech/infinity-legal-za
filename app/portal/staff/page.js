'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { REQUESTS, MEMBERS, PLANS } from '@/lib/demo-data'

export default function StaffDashboard() {
  const [user, setUser] = useState(null)
  const [realIntakes, setRealIntakes] = useState([])
  const [realCases, setRealCases] = useState([])
  
  useEffect(() => { setUser(demoAuth.getUser()) }, [])

  // Fetch real data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [intakeRes, casesRes] = await Promise.all([
          fetch('/api/intakes').catch(() => null),
          fetch('/api/cases').catch(() => null),
        ])
        if (intakeRes?.ok) { const d = await intakeRes.json(); setRealIntakes(d.data || []) }
        if (casesRes?.ok) { const d = await casesRes.json(); setRealCases(d.data || []) }
      } catch (e) {}
    }
    fetchData()
  }, [])

  if (!user) return null

  const assigned = REQUESTS.filter(r => r.assignedTo === user.id)
  const newMatters = REQUESTS.filter(r => r.status === 'new')
  const inProgress = REQUESTS.filter(r => r.status === 'in_progress')
  const resolved = REQUESTS.filter(r => r.status === 'resolved')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome, {user.name?.split(' ')[0]}</h1>
      <p className="text-gray-500 text-sm mb-6">Legal Advisor Centre</p>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Assigned to Me', value: assigned.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'New Matters', value: newMatters.length, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Resolved (Month)', value: resolved.length, color: 'bg-green-50 text-green-700' },
          { label: 'Avg Response', value: '4.2 hrs', color: 'bg-purple-50 text-purple-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-5`}>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Real intakes from DB */}
      {realIntakes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#0f2b46]">AI Intake Submissions (Database)</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Live Data</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="text-left px-5 py-2">Name</th><th className="text-left px-5 py-2">Category</th><th className="text-left px-5 py-2">Urgency</th><th className="text-left px-5 py-2">Cover Match</th><th className="text-left px-5 py-2">Status</th></tr></thead>
            <tbody>
              {realIntakes.slice(0, 5).map((intake, i) => {
                const coverMatch = ['labour', 'employment'].includes(intake.caseType) ? 'Employment' : ['civil', 'property', 'personal_injury'].includes(intake.caseType) ? 'Civil' : 'SME'
                return (
                  <tr key={intake.id || i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700 font-medium">{intake.firstName} {intake.lastName}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs capitalize">{(intake.caseType || '').replace('_', ' ')}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${intake.urgency === 'high' || intake.urgency === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{intake.urgency}</span></td>
                    <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${coverMatch === 'Employment' ? 'bg-blue-100 text-blue-700' : coverMatch === 'Civil' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{coverMatch} Cover</span></td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">{intake.status || 'Pending'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#0f2b46] mb-4">My Tasks</h3>
          <div className="space-y-2">
            {[
              { task: 'Review Thabo Mbeki CCMA documents', due: 'Today', urgent: true },
              { task: 'Draft letter of demand for lease dispute', due: 'Tomorrow', urgent: false },
              { task: 'Schedule consultation with Nomsa', due: 'Mar 16', urgent: true },
              { task: 'Prepare referral notes for litigation matter', due: 'Mar 18', urgent: false },
              { task: 'Review contract for Peter Naidoo', due: 'Mar 20', urgent: false },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded" /><span className="text-sm text-gray-700">{t.task}</span></div>
                <span className={`text-xs font-bold ${t.urgent ? 'text-red-500' : 'text-gray-400'}`}>{t.due}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0f2b46]">Recent Legal Matters</h3>
          </div>
          <div className="space-y-3">
            {REQUESTS.slice(0, 5).map(r => {
              const member = MEMBERS.find(m => m.id === r.memberId)
              const memberPlan = PLANS.find(p => p.id === member?.plan)
              return (
                <div key={r.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${r.status === 'new' ? 'bg-blue-400' : r.status === 'in_progress' ? 'bg-orange-400' : 'bg-green-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700"><strong>{member?.name || 'Unknown'}</strong> — {r.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{r.createdAt}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.category === 'Employment' ? 'bg-blue-50 text-blue-600' : r.category === 'Civil' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>{r.category}</span>
                      {memberPlan && <span className="text-[10px] text-gray-400">{memberPlan.name}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'new' ? 'bg-blue-100 text-blue-700' : r.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
