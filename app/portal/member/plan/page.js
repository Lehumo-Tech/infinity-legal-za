'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { demoAuth } from '@/lib/demo-auth'
import { PLANS } from '@/lib/demo-data'

const BILLING = [
  { date: '2026-03-15', amount: null, status: 'Upcoming' },
  { date: '2026-02-15', amount: null, status: 'Paid' },
  { date: '2026-01-15', amount: null, status: 'Paid' },
]

export default function PlanPage() {
  const [user, setUser] = useState(null)
  useEffect(() => { setUser(demoAuth.getUser()) }, [])
  if (!user) return null
  const plan = PLANS.find(p => p.id === user.plan)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0f2b46] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>My Plan</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0f2b46]">{plan?.name} Plan</h2>
            <p className="text-2xl font-bold text-[#0f2b46] mt-1">R{plan?.price}<span className="text-sm text-gray-400 font-normal">/month</span></p>
            <p className="text-xs text-gray-400 mt-1">Billing day: {user.billingDay}th of each month</p>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Active</span>
        </div>
        <hr className="my-4 border-gray-100" />
        <h3 className="text-sm font-bold text-gray-500 mb-3">WHAT'S COVERED</h3>
        <ul className="grid md:grid-cols-2 gap-2">
          {plan?.features.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>{f}</li>)}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-bold text-gray-500 mb-3">BENEFITS USAGE</h3>
        <div className="space-y-3">
          <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Consultations</span><span className="font-bold text-[#0f2b46]">{user.benefitsRemaining?.consults} remaining</span></div><div className="bg-gray-100 rounded-full h-2"><div className="bg-[#c9a961] h-2 rounded-full" style={{ width: `${Math.min(100, (user.benefitsRemaining?.consults / (plan?.benefits.consultsPerMonth === -1 ? 99 : plan?.benefits.consultsPerMonth || 2)) * 100)}%` }} /></div></div>
          <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Document Reviews</span><span className="font-bold text-[#0f2b46]">{user.benefitsRemaining?.documents} remaining</span></div><div className="bg-gray-100 rounded-full h-2"><div className="bg-[#0f2b46] h-2 rounded-full" style={{ width: `${Math.min(100, (user.benefitsRemaining?.documents / 10) * 100)}%` }} /></div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-500">BILLING HISTORY</h3></div>
        <table className="w-full text-sm">
          <tbody>
            {BILLING.map((b, i) => (
              <tr key={i} className="border-t border-gray-50"><td className="px-5 py-3 text-gray-600">{b.date}</td><td className="px-5 py-3 font-bold text-[#0f2b46]">R{plan?.price}</td><td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${b.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{b.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button onClick={() => alert('Payment method update coming soon!')} className="px-5 py-2.5 bg-[#0f2b46] text-white font-bold rounded-xl text-sm hover:bg-[#1a365d]">Update Payment</button>
        <button onClick={() => alert('📄 Invoice downloaded!')} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">Download Invoice</button>
        <button onClick={() => { if(confirm('Are you sure you want to cancel?')) alert('Subscription cancelled. Coverage continues until end of billing period.') }} className="px-5 py-2.5 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl">Cancel</button>
      </div>
    </div>
  )
}
