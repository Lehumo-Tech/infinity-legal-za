'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [cases, setCases] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      checkUser()
    }
  }, [mounted])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get profile (use maybeSingle to handle edge cases)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile error:', profileError)
      }

      setProfile(profileData)

      // Get cases
      const { data: casesData } = await supabase
        .from('cases')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      setCases(casesData || [])

      // Get subscription (use maybeSingle to handle no subscription case)
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*, pricing_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      setSubscription(subData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-infinity-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-infinity-navy mx-auto mb-4"></div>
          <p className="text-infinity-navy">Loading...</p>
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
              <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
              <span className="font-bold text-xl text-infinity-navy">My Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
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
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Welcome, {profile?.full_name}!</h1>
          <p className="text-infinity-navy/70">Manage your legal matters</p>
        </div>

        {/* Subscription Card */}
        {subscription ? (
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-infinity-navy mb-2">
                  {subscription.pricing_plans.name} Plan
                </h2>
                <p className="text-infinity-navy/70">
                  {subscription.credits_remaining} consultation credits remaining
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-infinity-gold">
                  R{subscription.pricing_plans.price_zar}/month
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
            href="/attorneys/browse"
            className="bg-white rounded-lg border border-infinity-gold/20 p-6 hover:border-infinity-gold transition-all"
          >
            <div className="text-4xl mb-3">⚖️</div>
            <h3 className="font-semibold text-infinity-navy mb-2">Find Attorney</h3>
            <p className="text-sm text-infinity-navy/70">Browse verified attorneys</p>
          </Link>
        </div>

        {/* My Cases */}
        <div className="bg-white rounded-lg border border-infinity-gold/20 p-6">
          <h2 className="text-xl font-semibold text-infinity-navy mb-4">My Cases</h2>
          
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-infinity-navy/70 mb-4">No cases yet</p>
              <Link
                href="/intake"
                className="inline-block px-6 py-2 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90"
              >
                Start Your First Case
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="border border-infinity-gold/20 rounded-lg p-4 hover:bg-infinity-cream/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-infinity-navy mb-1">{caseItem.title}</h3>
                      <p className="text-sm text-infinity-navy/70 mb-2">{caseItem.case_number}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-infinity-gold/10 text-infinity-navy text-xs rounded">
                          {caseItem.case_type}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {caseItem.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-infinity-navy/50">
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
