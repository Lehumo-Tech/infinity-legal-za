'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BookConsultationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedAttorney, setSelectedAttorney] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [userSubscription, setUserSubscription] = useState({
    plan: 'Family Protect',
    creditsRemaining: 2
  })

  const attorneys = [
    {
      id: '1',
      name: 'Adv. Thabo Mokwena',
      specializations: ['Criminal Law', 'Civil Litigation'],
      rating: 4.8,
      reviews: 124,
      hourlyRate: 1500,
      consultationFee: 750,
      availability: ['2025-03-22', '2025-03-23', '2025-03-25'],
      image: '👨‍⚖️'
    },
    {
      id: '2',
      name: 'Sarah van der Berg',
      specializations: ['Family Law', 'Divorce'],
      rating: 4.9,
      reviews: 98,
      hourlyRate: 1200,
      consultationFee: 600,
      availability: ['2025-03-22', '2025-03-24', '2025-03-26'],
      image: '👩‍⚖️'
    },
    {
      id: '3',
      name: 'Peter Naidoo',
      specializations: ['Labour Law', 'CCMA'],
      rating: 4.7,
      reviews: 156,
      hourlyRate: 1800,
      consultationFee: 900,
      availability: ['2025-03-21', '2025-03-23', '2025-03-24'],
      image: '👨‍⚖️'
    }
  ]

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

  const handleConfirm = async () => {
    // Mock booking API call
    const bookingData = {
      attorneyId: selectedAttorney.id,
      date: selectedDate,
      time: selectedTime,
      paymentMethod: paymentMethod,
      useCredit: paymentMethod === 'credit'
    }

    console.log('Booking:', bookingData)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    router.push('/consultation/confirmed')
  }

  return (
    <div className="min-h-screen bg-infinity-cream py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-sm text-infinity-navy/70 hover:text-infinity-navy mb-4 inline-flex items-center gap-1">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-infinity-navy">Book a Consultation</h1>
          <p className="text-xl text-infinity-navy/70">30-minute or 60-minute consultations available</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {['Choose Attorney', 'Select Date & Time', 'Payment', 'Confirm'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-infinity-navy text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="text-sm text-infinity-navy/70 hidden md:block">{label}</span>
              {i < 3 && <span className="text-infinity-navy/30">→</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Attorney */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-infinity-navy mb-6">Select an Attorney</h2>
            <div className="space-y-4">
              {attorneys.map(attorney => (
                <div
                  key={attorney.id}
                  onClick={() => {
                    setSelectedAttorney(attorney)
                    setStep(2)
                  }}
                  className="bg-white rounded-lg p-6 border-2 border-infinity-gold/20 hover:border-infinity-gold cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{attorney.image}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-infinity-navy mb-2">{attorney.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {attorney.specializations.map((spec, i) => (
                          <span key={i} className="px-3 py-1 bg-infinity-gold/10 text-infinity-navy text-sm rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-infinity-navy/70">
                        <span>⭐ {attorney.rating} ({attorney.reviews} reviews)</span>
                        <span>•</span>
                        <span>60-min: R{attorney.consultationFee}</span>
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90">
                      Select →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && selectedAttorney && (
          <div>
            <h2 className="text-2xl font-semibold text-infinity-navy mb-6">Choose Date & Time</h2>
            
            <div className="bg-white rounded-lg p-6 border border-infinity-gold/20 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">{selectedAttorney.image}</div>
                <div>
                  <h3 className="text-lg font-semibold text-infinity-navy">{selectedAttorney.name}</h3>
                  <p className="text-sm text-infinity-navy/70">60-min consultation - R{selectedAttorney.consultationFee}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-infinity-navy mb-3">Select Date</label>
                <div className="grid grid-cols-3 gap-3">
                  {selectedAttorney.availability.map(date => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedDate === date
                          ? 'border-infinity-navy bg-infinity-navy text-white'
                          : 'border-infinity-gold/20 hover:border-infinity-gold'
                      }`}
                    >
                      {new Date(date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-3">Select Time</label>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedTime === time
                            ? 'border-infinity-navy bg-infinity-navy text-white'
                            : 'border-infinity-gold/20 hover:border-infinity-gold'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-infinity-gold/20 text-infinity-navy rounded-lg hover:border-infinity-gold"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90 disabled:opacity-50"
              >
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold text-infinity-navy mb-6">Payment Method</h2>
            
            <div className="bg-white rounded-lg p-6 border border-infinity-gold/20 mb-6">
              <div className="space-y-4">
                {/* Use Credit */}
                <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-infinity-navy bg-infinity-navy/5'
                    : 'border-infinity-gold/20 hover:border-infinity-gold'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-infinity-navy mb-1">Use Subscription Credit</div>
                    <div className="text-sm text-infinity-navy/70">
                      You have {userSubscription.creditsRemaining} credits remaining this month
                    </div>
                    <div className="text-xs text-infinity-navy/50 mt-1">
                      Plan: {userSubscription.plan}
                    </div>
                  </div>
                  {userSubscription.creditsRemaining > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Recommended</span>
                  )}
                </label>

                {/* Direct Payment */}
                <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'direct'
                    ? 'border-infinity-navy bg-infinity-navy/5'
                    : 'border-infinity-gold/20 hover:border-infinity-gold'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="direct"
                    checked={paymentMethod === 'direct'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-infinity-navy mb-1">Pay Attorney Directly</div>
                    <div className="text-sm text-infinity-navy/70">
                      Direct EFT to attorney's trust account
                    </div>
                    <div className="text-lg font-bold text-infinity-gold mt-2">
                      R{selectedAttorney.consultationFee}
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'direct' && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Payment Instructions</h4>
                  <p className="text-sm text-amber-800">
                    After booking, you'll receive attorney trust account details via email. Payment must be made before the consultation.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 border-infinity-gold/20 text-infinity-navy rounded-lg hover:border-infinity-gold"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90"
              >
                Confirm Booking →
              </button>
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🗓️ Cancellation Policy</h3>
          <p className="text-sm text-blue-800">
            Free cancellation up to 24 hours before your consultation. Late cancellations or no-shows will forfeit credits or fees.
          </p>
        </div>
      </div>
    </div>
  )
}
