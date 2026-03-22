'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const SPECIALTIES = [
  'All Specialties',
  'Criminal Law',
  'Family Law',
  'Labour Law',
  'Personal Injury',
  'Property Law',
  'Civil Litigation',
  'Commercial Law',
  'Divorce',
  'Child Custody',
  'CCMA Disputes'
]

function AttorneyCard({ attorney, onSelect }) {
  return (
    <div className="bg-white rounded-xl border-2 border-transparent hover:border-infinity-gold/50 shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-infinity-navy/10 flex items-center justify-center text-3xl flex-shrink-0">
          ⚖️
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-infinity-navy truncate">{attorney.name}</h3>
            {attorney.isVerified && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">✓ Verified</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">LPC: {attorney.lpcNumber}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(attorney.specialty || []).map((spec, i) => (
              <span key={i} className="px-2.5 py-0.5 bg-infinity-gold/10 text-infinity-navy text-xs rounded-full font-medium">
                {spec}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>⭐ {attorney.rating} ({attorney.reviewCount} reviews)</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Consultation</p>
          <p className="text-xl font-bold text-infinity-gold">R{attorney.consultationFee}</p>
          <p className="text-xs text-muted-foreground">60 min</p>
          <button
            onClick={() => onSelect(attorney)}
            className="mt-3 px-5 py-2 bg-infinity-navy text-infinity-cream rounded-lg text-sm font-medium hover:bg-infinity-navy/90 transition-colors"
          >
            Select →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookConsultationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const caseId = searchParams.get('caseId')

  const [step, setStep] = useState(1)
  const [attorneys, setAttorneys] = useState([])
  const [loadingAttorneys, setLoadingAttorneys] = useState(true)
  const [selectedAttorney, setSelectedAttorney] = useState(null)
  const [filterSpecialty, setFilterSpecialty] = useState('All Specialties')
  const [searchQuery, setSearchQuery] = useState('')

  // Date/time selection
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Booking
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [consultationType, setConsultationType] = useState('direct_payment')
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [error, setError] = useState(null)

  // Fetch attorneys
  useEffect(() => {
    async function fetchAttorneys() {
      setLoadingAttorneys(true)
      try {
        let url = '/api/attorneys?'
        if (filterSpecialty && filterSpecialty !== 'All Specialties') {
          url += `specialty=${encodeURIComponent(filterSpecialty)}&`
        }
        if (searchQuery) {
          url += `search=${encodeURIComponent(searchQuery)}&`
        }
        const res = await fetch(url)
        const data = await res.json()
        setAttorneys(data.attorneys || [])
      } catch (err) {
        console.error('Failed to fetch attorneys:', err)
      } finally {
        setLoadingAttorneys(false)
      }
    }
    fetchAttorneys()
  }, [filterSpecialty, searchQuery])

  // Fetch availability when attorney is selected
  useEffect(() => {
    if (!selectedAttorney) return
    async function fetchAvailability() {
      try {
        const res = await fetch(`/api/attorneys/${selectedAttorney.id}/availability`)
        const data = await res.json()
        setAvailableDates(data.availableDates || [])
      } catch (err) {
        console.error('Failed to fetch availability:', err)
      }
    }
    fetchAvailability()
  }, [selectedAttorney])

  // Fetch time slots when date is selected
  useEffect(() => {
    if (!selectedAttorney || !selectedDate) return
    async function fetchSlots() {
      setLoadingSlots(true)
      setSelectedTime('')
      try {
        const res = await fetch(`/api/attorneys/${selectedAttorney.id}/availability?date=${selectedDate}`)
        const data = await res.json()
        setTimeSlots(data.timeSlots || [])
      } catch (err) {
        console.error('Failed to fetch time slots:', err)
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [selectedAttorney, selectedDate])

  const handleSelectAttorney = (attorney) => {
    setSelectedAttorney(attorney)
    setSelectedDate('')
    setSelectedTime('')
    setStep(2)
  }

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      setError('Please log in or create an account to book a consultation.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          attorneyId: selectedAttorney.id,
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          duration,
          consultationType,
          notes,
          caseId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Booking failed')
      }

      setBookingResult(data)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Booking confirmed
  if (step === 4 && bookingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-infinity-cream to-white">
        <div className="border-b border-infinity-gold/20 bg-white/80 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Infinity Legal" className="h-8 w-auto" />
              <span className="font-bold text-lg text-infinity-navy">Infinity Legal</span>
            </Link>
          </div>
        </div>

        <div className="container mx-auto max-w-xl px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-infinity-navy mb-3">Consultation Booked!</h1>
          <p className="text-muted-foreground mb-8">Your consultation has been confirmed. Details below.</p>

          <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 text-left shadow-sm mb-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Attorney</span>
                <span className="font-medium text-infinity-navy">{bookingResult.booking.attorney_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{new Date(bookingResult.booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-medium">{bookingResult.booking.booking_time?.substring(0, 5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{bookingResult.booking.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="text-xs font-mono text-muted-foreground">{bookingResult.booking.id?.substring(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-semibold text-blue-800 mb-2">📞 What happens next?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your attorney will confirm the booking shortly</li>
              <li>• You'll receive meeting details via email</li>
              <li>• Prepare any relevant documents before the consultation</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-medium hover:bg-infinity-navy/90"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-infinity-cream to-white">
      {/* Header */}
      <div className="border-b border-infinity-gold/20 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Infinity Legal" className="h-8 w-auto" />
            <span className="font-bold text-lg text-infinity-navy">Infinity Legal</span>
          </Link>
          <Link href="/" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-infinity-navy mb-2">Book a Consultation</h1>
          <p className="text-muted-foreground">Connect with a verified South African attorney</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2 md:gap-4">
          {['Choose Attorney', 'Select Date & Time', 'Confirm'].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-infinity-navy text-infinity-cream' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-sm hidden md:block ${step === i + 1 ? 'text-infinity-navy font-medium' : 'text-muted-foreground'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            {!isAuthenticated && (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="text-sm text-red-700 underline">Log in</Link>
                <span className="text-red-400">or</span>
                <Link href="/signup" className="text-sm text-red-700 underline">Sign up</Link>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Choose Attorney */}
        {step === 1 && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search attorneys by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold text-sm"
                />
              </div>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-infinity-gold/50"
              >
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Attorney List */}
            {loadingAttorneys ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-infinity-gold/20 flex items-center justify-center animate-pulse">
                  <span className="text-2xl">⚖️</span>
                </div>
                <p className="text-muted-foreground">Loading attorneys...</p>
              </div>
            ) : attorneys.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-lg text-muted-foreground mb-2">No attorneys found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
                <button
                  onClick={() => { setFilterSpecialty('All Specialties'); setSearchQuery('') }}
                  className="mt-4 text-sm text-infinity-navy underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {attorneys.map(att => (
                  <AttorneyCard key={att.id} attorney={att} onSelect={handleSelectAttorney} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && selectedAttorney && (
          <div>
            {/* Selected Attorney Summary */}
            <div className="bg-white rounded-xl border border-infinity-gold/20 p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-infinity-navy/10 flex items-center justify-center text-2xl">⚖️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-infinity-navy">{selectedAttorney.name}</h3>
                <p className="text-sm text-muted-foreground">{(selectedAttorney.specialty || []).join(', ')}</p>
              </div>
              <button onClick={() => { setStep(1); setSelectedDate(''); setSelectedTime('') }} className="text-sm text-infinity-navy/60 hover:text-infinity-navy">
                Change
              </button>
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-infinity-navy mb-3">Consultation Duration</h3>
              <div className="flex gap-3">
                {[30, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-center ${
                      duration === d
                        ? 'border-infinity-navy bg-infinity-navy text-infinity-cream'
                        : 'border-gray-200 hover:border-infinity-gold/50 bg-white'
                    }`}
                  >
                    <div className="font-semibold">{d} minutes</div>
                    <div className={`text-sm ${duration === d ? 'text-infinity-cream/70' : 'text-muted-foreground'}`}>
                      R{d === 30 ? selectedAttorney.consultationFee : selectedAttorney.consultationFee * 2}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-infinity-navy mb-3">Select a Date</h3>
              {availableDates.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-white rounded-xl p-4 border border-gray-200">
                  Loading available dates...
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {availableDates.map(d => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-center text-sm ${
                        selectedDate === d.date
                          ? 'border-infinity-navy bg-infinity-navy text-infinity-cream'
                          : 'border-gray-200 hover:border-infinity-gold/50 bg-white'
                      }`}
                    >
                      {d.dayLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="mb-6">
                <h3 className="font-medium text-infinity-navy mb-3">Select a Time</h3>
                {loadingSlots ? (
                  <p className="text-sm text-muted-foreground">Loading time slots...</p>
                ) : timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-white rounded-xl p-4 border border-gray-200">
                    No time slots available for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-3 px-3 rounded-xl border-2 transition-all text-center text-sm ${
                          !slot.available
                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                            : selectedTime === slot.time
                            ? 'border-infinity-navy bg-infinity-navy text-infinity-cream'
                            : 'border-gray-200 hover:border-infinity-gold/50 bg-white'
                        }`}
                      >
                        {slot.time}
                        {!slot.available && <span className="block text-xs">Booked</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <h3 className="font-medium text-infinity-navy mb-2">Notes for Attorney (Optional)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-infinity-gold/50 text-sm resize-none"
              />
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setSelectedDate(''); setSelectedTime('') }}
                className="px-6 py-3 border-2 border-gray-200 text-infinity-navy rounded-xl hover:border-infinity-gold/50 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-xl font-semibold hover:bg-infinity-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Review & Confirm →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && selectedAttorney && (
          <div>
            <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-infinity-navy mb-4">Booking Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-infinity-navy/10 flex items-center justify-center text-2xl">⚖️</div>
                  <div>
                    <p className="font-semibold text-infinity-navy">{selectedAttorney.name}</p>
                    <p className="text-sm text-muted-foreground">{(selectedAttorney.specialty || []).join(', ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                    <p className="font-medium">
                      {new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                    <p className="font-medium">{duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Consultation Fee</p>
                    <p className="text-xl font-bold text-infinity-gold">
                      R{duration === 30 ? selectedAttorney.consultationFee : selectedAttorney.consultationFee * 2}
                    </p>
                  </div>
                </div>

                {notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Notes</p>
                    <p className="text-sm text-infinity-navy">{notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-amber-900 mb-2">💳 Payment Information</h4>
              <p className="text-sm text-amber-800">
                After confirming, you'll receive the attorney's trust account details via email. 
                Payment must be made before the consultation. Payment integration coming soon.
              </p>
            </div>

            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">🔐 Account Required</h4>
                <p className="text-sm text-blue-700 mb-3">
                  You need to be logged in to complete your booking.
                </p>
                <div className="flex gap-2">
                  <Link href="/login" className="px-4 py-2 bg-infinity-navy text-infinity-cream rounded-lg text-sm font-medium hover:bg-infinity-navy/90">
                    Log In
                  </Link>
                  <Link href="/signup" className="px-4 py-2 bg-infinity-gold text-infinity-navy rounded-lg text-sm font-medium hover:bg-infinity-gold/90">
                    Sign Up
                  </Link>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 border-gray-200 text-infinity-navy rounded-xl hover:border-infinity-gold/50 font-medium"
              >
                ← Change Date/Time
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={submitting || !isAuthenticated}
                className="flex-1 px-6 py-4 bg-infinity-navy text-infinity-cream rounded-xl font-semibold hover:bg-infinity-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-lg"
              >
                {submitting ? 'Booking...' : '✓ Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        <div className="mt-8 bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-1 text-sm">🗓️ Cancellation Policy</h3>
          <p className="text-xs text-blue-800">
            Free cancellation up to 24 hours before your consultation. Late cancellations or no-shows may forfeit fees.
          </p>
        </div>
      </div>
    </div>
  )
}
