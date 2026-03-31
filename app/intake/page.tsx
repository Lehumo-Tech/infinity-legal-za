'use client'

import React from 'react'
import { useIntakeWizard } from '@/hooks/useIntakeWizard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NAVY = '#0f2b46'
const GOLD = '#c9a961'

const STEP_META = [
  { title: 'Contact Information', desc: 'Tell us how to reach you' },
  { title: 'Matter Details', desc: 'Describe your legal matter' },
  { title: 'Parties Involved', desc: 'Who is involved in this matter?' },
  { title: 'Documents & Timeline', desc: 'Evidence and key dates' },
  { title: 'Consent & Submit', desc: 'Review and authorise your submission' },
]

const CASE_TYPES = [
  { value: 'labour', label: 'Labour / Employment' },
  { value: 'criminal', label: 'Criminal Law' },
  { value: 'family', label: 'Family Law' },
  { value: 'civil', label: 'Civil Litigation' },
  { value: 'commercial', label: 'Commercial Law' },
  { value: 'property', label: 'Property Law' },
  { value: 'personal_injury', label: 'Personal Injury' },
  { value: 'other', label: 'Other' },
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low — No immediate deadline' },
  { value: 'medium', label: 'Medium — Within a few weeks' },
  { value: 'high', label: 'High — Within days' },
  { value: 'emergency', label: 'Emergency — Immediate action needed' },
]

/* ─── Field Error ─── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

/* ═══ STEP COMPONENTS (Pure UI) ═══ */

function StepContact({ form }: { form: ReturnType<typeof useIntakeWizard>['form'] }) {
  const { register, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" placeholder="Tidimalo" {...register('firstName')} className="mt-1" />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" placeholder="Tsatsi" {...register('lastName')} className="mt-1" />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" type="email" placeholder="tidimalo@infinitylegal.co.za" {...register('email')} className="mt-1" />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input id="phone" placeholder="+27 82 123 4567" {...register('phone')} className="mt-1" />
        <FieldError message={errors.phone?.message} />
        <p className="text-[11px] text-gray-400 mt-1">South African format: +27XXXXXXXXX or 0XXXXXXXXX</p>
      </div>
    </div>
  )
}

function StepCaseDetails({ form }: { form: ReturnType<typeof useIntakeWizard>['form'] }) {
  const { register, setValue, watch, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <div>
        <Label>Case Type *</Label>
        <Select value={watch('caseType')} onValueChange={(v) => setValue('caseType', v as 'labour', { shouldValidate: true })}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select a case type" /></SelectTrigger>
          <SelectContent>
            {CASE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <FieldError message={errors.caseType?.message} />
      </div>
      <div>
        <Label>Urgency *</Label>
        <Select value={watch('urgency')} onValueChange={(v) => setValue('urgency', v as 'low', { shouldValidate: true })}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select urgency level" /></SelectTrigger>
          <SelectContent>
            {URGENCY_LEVELS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <FieldError message={errors.urgency?.message} />
      </div>
      <div>
        <Label htmlFor="description">Describe Your Legal Matter *</Label>
        <Textarea
          id="description"
          placeholder="Please explain what happened, when it happened, and what you need help with..."
          rows={5}
          {...register('description')}
          className="mt-1 resize-none"
        />
        <div className="flex justify-between mt-1">
          <FieldError message={errors.description?.message} />
          <span className="text-[11px] text-gray-400">{(watch('description') || '').length}/5000</span>
        </div>
      </div>
    </div>
  )
}

function StepParties({ form }: { form: ReturnType<typeof useIntakeWizard>['form'] }) {
  const { register, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="opposingParty">Opposing Party (Name / Organisation)</Label>
        <Input id="opposingParty" placeholder="ABC Mining (Pty) Ltd" {...register('opposingParty')} className="mt-1" />
        <FieldError message={errors.opposingParty?.message} />
      </div>
      <div>
        <Label htmlFor="opposingPartyContact">Opposing Party Contact (if known)</Label>
        <Input id="opposingPartyContact" placeholder="Email or phone number" {...register('opposingPartyContact')} className="mt-1" />
        <FieldError message={errors.opposingPartyContact?.message} />
      </div>
      <div>
        <Label htmlFor="witnesses">Witnesses</Label>
        <Textarea
          id="witnesses"
          placeholder="List any witnesses who can support your case (names and contact details)..."
          rows={4}
          {...register('witnesses')}
          className="mt-1 resize-none"
        />
        <FieldError message={errors.witnesses?.message} />
      </div>
    </div>
  )
}

function StepDocuments({ form }: { form: ReturnType<typeof useIntakeWizard>['form'] }) {
  const { register, setValue, watch, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="incidentDate">Date of Incident</Label>
        <Input id="incidentDate" type="date" {...register('incidentDate')} className="mt-1" />
        <FieldError message={errors.incidentDate?.message} />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="hasDocuments"
          checked={watch('hasDocuments')}
          onCheckedChange={(v) => setValue('hasDocuments', !!v, { shouldValidate: true })}
        />
        <Label htmlFor="hasDocuments" className="cursor-pointer">I have supporting documents</Label>
      </div>
      {watch('hasDocuments') && (
        <div>
          <Label htmlFor="documentList">List Your Documents</Label>
          <Textarea
            id="documentList"
            placeholder="Employment contract, dismissal letter, payslips, WhatsApp messages..."
            rows={4}
            {...register('documentList')}
            className="mt-1 resize-none"
          />
          <FieldError message={errors.documentList?.message} />
          <p className="text-[11px] text-gray-400 mt-1">You can upload documents later after your case is opened.</p>
        </div>
      )}
    </div>
  )
}

function StepConsent({ form }: { form: ReturnType<typeof useIntakeWizard>['form'] }) {
  const { setValue, watch, formState: { errors } } = form
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl p-4 border" style={{ backgroundColor: `${NAVY}06`, borderColor: `${NAVY}15` }}>
        <h4 className="text-sm font-bold mb-3" style={{ color: NAVY }}>Submission Summary</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{form.getValues('firstName')} {form.getValues('lastName')}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{form.getValues('email')}</span></div>
          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{form.getValues('phone')}</span></div>
          <div><span className="text-gray-500">Case Type:</span> <span className="font-medium capitalize">{form.getValues('caseType')?.replace('_', ' ')}</span></div>
          <div><span className="text-gray-500">Urgency:</span> <span className="font-medium capitalize">{form.getValues('urgency')}</span></div>
        </div>
        <div className="mt-3 text-sm">
          <span className="text-gray-500">Description:</span>
          <p className="font-medium mt-1 line-clamp-3">{form.getValues('description')}</p>
        </div>
      </div>

      {/* Consent */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={watch('consent') === true}
            onCheckedChange={(v) => setValue('consent', v === true ? true : undefined as unknown as true, { shouldValidate: true })}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="consent" className="cursor-pointer text-sm">I confirm that the information provided is true and accurate to the best of my knowledge. *</Label>
            <FieldError message={errors.consent?.message} />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="popiaConsent"
            checked={watch('popiaConsent') === true}
            onCheckedChange={(v) => setValue('popiaConsent', v === true ? true : undefined as unknown as true, { shouldValidate: true })}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="popiaConsent" className="cursor-pointer text-sm">I consent to Infinity Legal processing my personal information in accordance with POPIA. *</Label>
            <FieldError message={errors.popiaConsent?.message} />
          </div>
        </div>

        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <input type="checkbox" required id="coverDisclaimer" className="mt-1 w-4 h-4 rounded" />
          <label htmlFor="coverDisclaimer" className="cursor-pointer text-sm text-blue-900">
            I understand the 30-day waiting period for pre-existing matters and that coverage limits apply (R82,000 or R100,000 per case depending on plan). *
          </label>
        </div>
      </div>
    </div>
  )
}

/* ═══ MAIN PAGE — No Logic, Only Hook Orchestration ═══ */
export default function IntakePage() {
  const { form, currentStep, totalSteps, nextStep, prevStep, submit, isSubmitting, submitError } = useIntakeWizard()
  const meta = STEP_META[currentStep - 1]
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
            <span className="text-lg font-bold tracking-wide" style={{ color: NAVY, fontFamily: 'Playfair Display, serif' }}>
              INFINITY LEGAL
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400">New Client Intake</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Cover Info */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Please Note:</strong> By submitting this intake, your matter will be analysed 
              by our AI and assigned to a qualified legal specialist. All plans include court representation, 
              24-hour contact centre access, and cover for your family. A 30-day waiting period applies 
              for pre-existing matters.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: GOLD }}>Step {currentStep} of {totalSteps}</span>
              <span className="text-xs text-gray-400">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            {/* Step indicators */}
            <div className="flex justify-between mt-3">
              {STEP_META.map((s, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: `${100 / totalSteps}%` }}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      i + 1 <= currentStep ? 'text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                    style={i + 1 <= currentStep ? { backgroundColor: i + 1 === currentStep ? NAVY : GOLD } : undefined}
                  >
                    {i + 1 < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 hidden sm:block text-center">{s.title.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl" style={{ color: NAVY, fontFamily: 'Playfair Display, serif' }}>
                {meta.title}
              </CardTitle>
              <CardDescription>{meta.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step Content */}
              <div className="min-h-[280px]">
                {currentStep === 1 && <StepContact form={form} />}
                {currentStep === 2 && <StepCaseDetails form={form} />}
                {currentStep === 3 && <StepParties form={form} />}
                {currentStep === 4 && <StepDocuments form={form} />}
                {currentStep === 5 && <StepConsent form={form} />}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6"
                >
                  Back
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="px-8 text-white font-medium"
                    style={{ backgroundColor: NAVY }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submit}
                    disabled={isSubmitting}
                    className="px-8 font-medium text-white min-w-[160px]"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Intake'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4">
        <p className="text-center text-xs text-gray-400" style={{ fontFamily: 'Playfair Display, serif' }}>
          Legal Excellence Without Limits
        </p>
      </footer>
    </div>
  )
}
