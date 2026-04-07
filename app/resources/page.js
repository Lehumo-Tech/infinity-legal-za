'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

/* ─── DATA ─── */

const LEGAL_ARTICLES = [
  {
    id: 'unfair-dismissal',
    category: 'Labour Law',
    title: 'Understanding Unfair Dismissal in South Africa',
    excerpt: 'The Labour Relations Act 66 of 1995 protects employees against unfair dismissal. Learn what constitutes unfair dismissal, the CCMA process, and remedies available to you.',
    content: `Under the Labour Relations Act (LRA) 66 of 1995, every employee has the right not to be unfairly dismissed. There are three categories of dismissal:

**1. Misconduct** — The employer must prove the employee committed the alleged offence AND that dismissal was a fair sanction. A disciplinary hearing must be held first.

**2. Incapacity (Poor Performance or Ill-Health)** — The employer must show they gave the employee a reasonable opportunity to improve and provided counselling/training.

**3. Operational Requirements (Retrenchment)** — Section 189 of the LRA requires fair consultation with employees and consideration of alternatives to retrenchment.

**Your Remedies:**
- File a referral at the CCMA within 30 days of dismissal
- The CCMA will first attempt conciliation
- If unresolved, arbitration proceedings follow
- Remedies include reinstatement or compensation (up to 12 months' salary)

**Important:** If you were dismissed for participating in a protected strike, the dismissal is automatically unfair (s187), and compensation can be up to 24 months' remuneration.`,
    readTime: '5 min',
    date: '2026-03-15',
  },
  {
    id: 'protection-order',
    category: 'Family Law',
    title: 'How to Apply for a Protection Order (Domestic Violence Act)',
    excerpt: 'The Domestic Violence Act 116 of 1998 provides protection to victims. Here\'s a step-by-step guide to obtaining a protection order in South Africa.',
    content: `The Domestic Violence Act 116 of 1998 recognises that domestic violence is a serious crime. Any person in a domestic relationship who is being abused can apply for a protection order.

**Who Can Apply:**
- A spouse or partner
- A family member
- Any person in a domestic relationship (including same-sex relationships)
- A parent on behalf of a child

**Step-by-Step Process:**
1. Go to your nearest Magistrate's Court
2. Complete the prescribed application form (Form 2)
3. Make a statement under oath describing the abuse
4. The Magistrate may grant an interim protection order immediately
5. A return date will be set (usually within 10 days)
6. The respondent will be served with the order and notice
7. On the return date, the court decides on a final protection order

**Important Information:**
- The application is FREE — no legal fees required
- You do NOT need a lawyer (but legal representation helps)
- The order can include: no contact, exclusive occupation of shared residence, seizure of firearms
- Breach of a protection order is a criminal offence (up to 5 years imprisonment)
- You can apply at ANY Magistrate's Court, not just your local one`,
    readTime: '4 min',
    date: '2026-03-10',
  },
  {
    id: 'tenant-rights',
    category: 'Property Law',
    title: 'Know Your Rights as a Tenant in South Africa',
    excerpt: 'The Rental Housing Act 50 of 1999 sets out the rights and obligations of both landlords and tenants. Know what your landlord can and cannot do.',
    content: `The Rental Housing Act 50 of 1999 and the Consumer Protection Act 68 of 2008 together protect tenants in South Africa.

**Your Key Rights as a Tenant:**
- Right to a written lease agreement
- Right to a habitable dwelling (running water, working electricity, structural integrity)
- Right to privacy — your landlord MUST give reasonable notice before entering
- Right to a deposit refund within 14 days of vacating (with an inspection report)
- Right to not be unfairly discriminated against

**Deposit Rules:**
- Your deposit must be held in an interest-bearing account
- The landlord must provide you with the account details
- On vacating, a joint inspection must be conducted
- The deposit + interest must be refunded within 14 days, minus any legitimate deductions
- The landlord must provide an itemised list of deductions

**Illegal Actions by Landlords:**
- Changing locks to force you out (illegal eviction)
- Cutting electricity or water
- Entering without notice
- Increasing rent without proper notice (usually 1-3 months)
- Refusing to refund your deposit without valid reasons

**Where to Get Help:**
- Rental Housing Tribunal (free dispute resolution)
- Legal Aid South Africa
- Your provincial Consumer Protection office`,
    readTime: '6 min',
    date: '2026-03-05',
  },
  {
    id: 'ccma-process',
    category: 'Labour Law',
    title: 'The CCMA Process: What to Expect',
    excerpt: 'A practical guide to the Commission for Conciliation, Mediation and Arbitration (CCMA) — from referral to award.',
    content: `The CCMA (Commission for Conciliation, Mediation and Arbitration) is a dispute resolution body established under the Labour Relations Act.

**Step 1: Referral**
- File your case within 30 days of dismissal (or 6 months for unfair labour practices)
- Complete the referral form (Form 7.11) at your nearest CCMA office or online at www.ccma.org.za
- There is NO fee to file a case

**Step 2: Conciliation**
- A commissioner will be appointed within 30 days
- Both parties attend an informal meeting
- The commissioner attempts to facilitate a settlement
- If settlement is reached, it becomes a binding agreement
- If NOT settled, a certificate of non-resolution is issued

**Step 3: Arbitration (if conciliation fails)**
- You must request arbitration within 90 days of the certificate
- This is a formal hearing — evidence and witnesses are called
- The commissioner makes a final and binding decision (award)
- The award must be issued within 14 days

**Tips for Success:**
- Bring ALL documentary evidence (employment contract, payslips, correspondence)
- Prepare your witnesses in advance
- Be punctual — non-attendance may result in dismissal of your case
- Consider legal representation for complex matters
- Keep copies of everything you submit`,
    readTime: '5 min',
    date: '2026-02-28',
  },
  {
    id: 'road-accident-claims',
    category: 'Civil Law',
    title: 'Road Accident Fund (RAF) Claims Explained',
    excerpt: 'If you were injured in a motor vehicle accident in South Africa, you may be entitled to compensation from the Road Accident Fund.',
    content: `The Road Accident Fund (RAF) provides compulsory cover to all users of South African roads against injuries or death arising from motor vehicle accidents.

**Who Can Claim:**
- Any person injured in a road accident in South Africa
- Dependants of someone killed in a road accident
- Pedestrians, cyclists, passengers, and drivers (subject to fault)

**What You Can Claim For:**
- Past and future medical expenses
- Past and future loss of earnings/income
- General damages (pain and suffering) — for serious injuries only
- Funeral costs (in death claims)
- Loss of support (for dependants)

**Time Limits (Prescription):**
- You must submit your claim within 3 YEARS of the accident
- For hit-and-run accidents: the claim must be lodged within 2 years
- Minors: the claim must be lodged within 3 years of turning 18

**Required Documents:**
- Certified copy of ID
- Police accident report (case number)
- Medical records and reports
- Proof of income (payslips, tax returns)
- Hospital records
- Witness statements

**Important Changes:**
The RAF Amendment Act 19 of 2005 removed the right to claim general damages for minor injuries. You must prove a "serious injury" as assessed by the RAF's medical panel.`,
    readTime: '6 min',
    date: '2026-02-20',
  },
  {
    id: 'small-claims-court',
    category: 'Civil Law',
    title: 'Small Claims Court: A Free Way to Resolve Disputes',
    excerpt: 'The Small Claims Court handles civil matters up to R20,000 without the need for a lawyer. Learn how it works.',
    content: `Small Claims Courts were established under the Small Claims Courts Act 61 of 1984 and offer a quick, free, and informal way to resolve minor civil disputes.

**Jurisdiction:**
- Claims up to R20,000
- Only individuals can sue (not companies, except close corporations suing in their personal name)
- The defendant must reside or work in the court's area

**Types of Claims:**
- Unpaid debts
- Damage to property
- Breach of contract
- Return of property
- Delivery of goods paid for

**How to File:**
1. Visit your nearest Small Claims Court (usually at the Magistrate's Court)
2. Complete the summons form
3. The court will set a hearing date
4. Serve the summons on the defendant (at least 10 days before hearing)
5. Attend the hearing on the set date

**Key Rules:**
- NO lawyers are allowed (you represent yourself)
- NO appeal against the decision
- The Commissioner's decision is final and binding
- Cases are heard in the evenings (usually from 18:00)
- There are NO court fees

**Tip:** Bring all evidence — receipts, contracts, photos, text messages, and any witnesses. The Commissioner will ask questions to both parties and make a decision.`,
    readTime: '4 min',
    date: '2026-02-15',
  },
]

const CONTRACT_TEMPLATES = [
  {
    id: 'employment-contract',
    title: 'Basic Employment Contract',
    description: 'Compliant with the Basic Conditions of Employment Act 75 of 1997. Includes all required sections 29 terms.',
    category: 'Labour Law',
    sections: [
      'Parties & Commencement Date',
      'Job Title & Description',
      'Place of Work',
      'Working Hours (Section 9 BCEA)',
      'Remuneration & Payment Date',
      'Deductions (Section 34 BCEA)',
      'Leave Entitlement (Annual, Sick, Family Responsibility, Maternity)',
      'Notice Period & Termination',
      'Restraint of Trade',
      'Confidentiality',
      'Disciplinary & Grievance Procedures',
    ],
  },
  {
    id: 'lease-agreement',
    title: 'Residential Lease Agreement',
    description: 'Compliant with the Rental Housing Act 50 of 1999 and Consumer Protection Act 68 of 2008.',
    category: 'Property Law',
    sections: [
      'Parties (Landlord & Tenant)',
      'Property Description & Address',
      'Lease Period & Renewal',
      'Monthly Rental & Escalation',
      'Deposit Amount & Bank Details',
      'Maintenance Responsibilities',
      'House Rules & Conduct',
      'Breach & Remedies',
      'Inspection Procedures',
      'Early Termination Clause',
    ],
  },
  {
    id: 'service-agreement',
    title: 'Service Level Agreement',
    description: 'General service provider contract suitable for freelancers, consultants, and contractors.',
    category: 'Commercial Law',
    sections: [
      'Parties & Definitions',
      'Scope of Services',
      'Deliverables & Timelines',
      'Fees & Payment Terms',
      'Intellectual Property Rights',
      'Confidentiality & NDA',
      'Limitation of Liability',
      'Indemnification',
      'Term & Termination',
      'Dispute Resolution',
    ],
  },
  {
    id: 'nda',
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Mutual or unilateral NDA to protect confidential business information.',
    category: 'Commercial Law',
    sections: [
      'Parties',
      'Definition of Confidential Information',
      'Obligations of Receiving Party',
      'Exclusions from Confidentiality',
      'Term & Duration',
      'Return of Materials',
      'Remedies for Breach',
      'Governing Law (SA)',
    ],
  },
  {
    id: 'loan-agreement',
    title: 'Personal Loan Agreement',
    description: 'Compliant with the National Credit Act 34 of 2005 for personal lending between individuals.',
    category: 'Civil Law',
    sections: [
      'Parties (Lender & Borrower)',
      'Loan Amount & Purpose',
      'Interest Rate (within NCA limits)',
      'Repayment Schedule',
      'Security/Collateral (if any)',
      'Default & Remedies',
      'Early Settlement',
      'Governing Law',
    ],
  },
  {
    id: 'power-of-attorney',
    title: 'General Power of Attorney',
    description: 'Authorise someone to act on your behalf in legal, financial, or administrative matters.',
    category: 'Civil Law',
    sections: [
      'Principal & Agent Details',
      'Scope of Authority',
      'Duration & Conditions',
      'Limitations on Authority',
      'Revocation Clause',
      'Witness Requirements',
      'Commissioner of Oaths Attestation',
    ],
  },
]

const CLAIM_FORMS = [
  {
    id: 'ccma-referral',
    title: 'CCMA Referral Form (7.11)',
    description: 'For unfair dismissal, unfair labour practice, or workplace dispute referrals to the CCMA.',
    requirements: ['Copy of ID', 'Employment contract', 'Termination letter', 'Payslips (last 3 months)'],
    deadline: '30 days from date of dismissal',
    filing: 'CCMA (online or nearest office)',
  },
  {
    id: 'raf-claim',
    title: 'RAF Claim Form (RAF1)',
    description: 'Road Accident Fund claim for injuries sustained in a motor vehicle accident.',
    requirements: ['Certified ID copy', 'Police report & case number', 'Medical reports', 'Hospital records', 'Proof of income'],
    deadline: '3 years from accident date',
    filing: 'Road Accident Fund',
  },
  {
    id: 'protection-order',
    title: 'Protection Order Application (Form 2)',
    description: 'Application for a protection order under the Domestic Violence Act 116 of 1998.',
    requirements: ['ID document', 'Sworn statement of abuse', 'Any evidence (photos, messages, medical records)'],
    deadline: 'No deadline — apply immediately',
    filing: 'Nearest Magistrate\'s Court (FREE)',
  },
  {
    id: 'maintenance-claim',
    title: 'Maintenance Court Application',
    description: 'Claim maintenance for children or a spouse under the Maintenance Act 99 of 1998.',
    requirements: ['Certified ID copies (applicant & child)', 'Birth certificate of child', 'Proof of respondent\'s income (if available)', 'Proof of child\'s expenses'],
    deadline: 'No deadline',
    filing: 'Maintenance Court at Magistrate\'s Court (FREE)',
  },
  {
    id: 'small-claims',
    title: 'Small Claims Court Summons',
    description: 'For civil claims up to R20,000 — no lawyers required.',
    requirements: ['ID document', 'Proof of claim (receipts, contracts, messages)', 'Defendant\'s address'],
    deadline: '3 years from date of claim arising',
    filing: 'Small Claims Court (FREE)',
  },
  {
    id: 'labour-court',
    title: 'Labour Court Statement of Claim',
    description: 'For cases referred from the CCMA or complex labour disputes requiring court adjudication.',
    requirements: ['CCMA certificate of outcome', 'Employment records', 'Statement of claim', 'Supporting documents'],
    deadline: '6 months from CCMA certificate',
    filing: 'Labour Court',
  },
]

const EXTENDED_FAQS = [
  { category: 'General', q: 'What does Infinity Legal Protection offer?', a: 'Infinity Legal provides affordable legal protection plans that include consultations, document preparation, and AI-powered legal assistance for South African individuals and families. Plans start from R99/month.' },
  { category: 'General', q: 'How does the AI Legal Intake work?', a: 'Our AI analyses your legal situation using South African law, identifies the category (Employment, Civil, Property, Consumer), assesses urgency, and connects you with a qualified legal advisor. The process takes under 5 minutes.' },
  { category: 'General', q: 'Is my information confidential?', a: 'Absolutely. All communications are protected by legal privilege. We comply with POPIA (Protection of Personal Information Act). Your data is encrypted at rest, never shared without consent, and you can request deletion at any time.' },
  { category: 'Membership', q: 'What plan options are available?', a: 'We offer three plans: Civil Legal Plan (R99/mo — contract, consumer, property disputes), Labour Legal Plan (R99/mo — unfair dismissal, CCMA, workplace issues), and Extensive Plan (R139/mo — all civil, labour, AND criminal matters with priority handling). All plans include unlimited consultations, 24-hour contact centre, free will & testament, and family plan.' },
  { category: 'Membership', q: 'Can I cancel my subscription?', a: 'Yes, cancel anytime from your dashboard. Your coverage continues until the end of your billing period. No cancellation fees. No lock-in contracts.' },
  { category: 'Membership', q: 'Is there a waiting period?', a: 'For new matters arising after sign-up: no waiting period for consultations and AI services. For active representation coverage, there may be a 30-day waiting period depending on the plan.' },
  { category: 'Labour Law', q: 'I was fired without a hearing. What can I do?', a: 'In most cases, dismissal without a disciplinary hearing is procedurally unfair. You should file a referral at the CCMA within 30 days of your dismissal date. You may be entitled to reinstatement or compensation of up to 12 months\' salary.' },
  { category: 'Labour Law', q: 'My employer is not paying me on time. Is this legal?', a: 'No. Section 32 of the Basic Conditions of Employment Act requires payment in South African currency, at the agreed workplace, and on the agreed date (at least monthly). Contact the Department of Employment and Labour to lodge a complaint.' },
  { category: 'Family Law', q: 'How do I apply for a divorce in South Africa?', a: 'You must issue a summons at the High Court or Regional Court. Grounds include irretrievable breakdown of the marriage, mental illness, or continuous unconsciousness. Consider mediation first to resolve custody and asset division amicably.' },
  { category: 'Family Law', q: 'How is child maintenance calculated?', a: 'The Maintenance Court considers both parents\' income, the child\'s needs (education, medical, housing, food), the standard of living, and each parent\'s ability to contribute. There is no fixed formula — it\'s assessed case by case.' },
  { category: 'Criminal Law', q: 'I was arrested. What are my rights?', a: 'Section 35 of the Constitution guarantees: the right to remain silent, the right to be informed of the charge, the right to legal representation (at state expense if needed), the right to be brought before a court within 48 hours, and the right to bail (unless court finds exceptional circumstances).' },
  { category: 'Criminal Law', q: 'What is the difference between bail and bond?', a: 'Bail is set by the court and allows an accused person to be released pending trial. A bond (or surety) is when a third party pledges money or assets to guarantee the accused will appear in court. Schedule 5 and 6 offences have stricter bail conditions.' },
  { category: 'Property Law', q: 'Can my landlord evict me without a court order?', a: 'No. Under the Prevention of Illegal Eviction Act (PIE) 19 of 1998, no person may be evicted without a court order. Even if you are behind on rent, the landlord must follow the legal process. Changing locks or cutting services is illegal.' },
  { category: 'Property Law', q: 'My landlord won\'t return my deposit. What can I do?', a: 'The Rental Housing Act requires the deposit to be refunded within 14 days of vacating. If the landlord fails to comply, lodge a complaint with the Rental Housing Tribunal (free service). You can also sue in the Small Claims Court for amounts up to R20,000.' },
  { category: 'Account', q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a secure reset link within minutes. If you don\'t receive it, check your spam folder or contact support@infinitylegal.org.' },
  { category: 'Account', q: 'How do I update my personal information?', a: 'Log in to your account, go to Settings > Profile, and update your details. For changes to your legal name, please contact support with a certified copy of your ID.' },
]

/* ─── COMPONENT ─── */

function ResourcesPageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('articles')
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [expandedTemplate, setExpandedTemplate] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [faqFilter, setFaqFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  /* Email Gate Modal State */
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailModalTemplate, setEmailModalTemplate] = useState(null)
  const [gateEmail, setGateEmail] = useState('')
  const [gateName, setGateName] = useState('')
  const [gateSubmitted, setGateSubmitted] = useState(false)
  const [gateLoading, setGateLoading] = useState(false)
  const [unlockedTemplates, setUnlockedTemplates] = useState([])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['articles', 'templates', 'faqs', 'claims'].includes(tab)) {
      setActiveTab(tab)
    }
    // Load unlocked templates from localStorage
    try {
      const saved = localStorage.getItem('infinity_unlocked_templates')
      if (saved) setUnlockedTemplates(JSON.parse(saved))
    } catch (e) {}
  }, [searchParams])

  const handleEmailGateSubmit = (e) => {
    e.preventDefault()
    setGateLoading(true)
    // Simulate API call
    setTimeout(() => {
      setGateLoading(false)
      setGateSubmitted(true)
      const newUnlocked = [...unlockedTemplates, emailModalTemplate]
      setUnlockedTemplates(newUnlocked)
      try { localStorage.setItem('infinity_unlocked_templates', JSON.stringify(newUnlocked)) } catch(e) {}
    }, 1500)
  }

  const openEmailGate = (templateId) => {
    if (unlockedTemplates.includes(templateId)) return // already unlocked
    setEmailModalTemplate(templateId)
    setGateEmail('')
    setGateName('')
    setGateSubmitted(false)
    setGateLoading(false)
    setEmailModalOpen(true)
  }

  const tabs = [
    { id: 'articles', label: 'Legal Articles', icon: '📚', count: LEGAL_ARTICLES.length },
    { id: 'templates', label: 'Contract Templates', icon: '📋', count: CONTRACT_TEMPLATES.length },
    { id: 'faqs', label: 'FAQs', icon: '❓', count: EXTENDED_FAQS.length },
    { id: 'claims', label: 'Claim Forms', icon: '📄', count: CLAIM_FORMS.length },
  ]

  const faqCategories = ['All', ...new Set(EXTENDED_FAQS.map(f => f.category))]
  const filteredFaqs = EXTENDED_FAQS.filter(f => {
    const matchCategory = faqFilter === 'All' || f.category === faqFilter
    const matchSearch = !searchQuery || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* ═══ EMAIL GATE MODAL ═══ */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEmailModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            {!gateSubmitted ? (
              <>
                <div className="bg-[#0f2b46] p-6 text-center">
                  <div className="w-14 h-14 bg-[#c9a961]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Unlock Premium Template</h3>
                  <p className="text-white/60 text-sm mt-1">Enter your details to access this free legal template</p>
                </div>
                <form onSubmit={handleEmailGateSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0f2b46] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={gateName}
                      onChange={(e) => setGateName(e.target.value)}
                      placeholder="e.g. Thabo Mbeki"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0f2b46] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">By submitting, you agree to receive legal updates from Infinity Legal. You can unsubscribe anytime. We comply with POPIA.</p>
                  <button
                    type="submit"
                    disabled={gateLoading}
                    className="w-full py-3 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl hover:bg-[#d4af37] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {gateLoading ? (
                      <><span className="w-4 h-4 border-2 border-[#0f2b46]/30 border-t-[#0f2b46] rounded-full animate-spin" /> Processing...</>
                    ) : (
                      'Unlock Template →'
                    )}
                  </button>
                  <button type="button" onClick={() => setEmailModalOpen(false)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    Maybe later
                  </button>
                </form>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-[#0f2b46] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Template Unlocked!</h3>
                <p className="text-gray-500 text-sm mb-1">Thank you, {gateName}!</p>
                <p className="text-gray-400 text-sm mb-6">The template sections are now visible below. We&apos;ve also sent a copy to <strong className="text-[#0f2b46]">{gateEmail}</strong></p>
                <button onClick={() => setEmailModalOpen(false)} className="px-8 py-3 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d] transition-colors">
                  View Template →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-[#0f2b46] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 rounded-lg" />
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/#policies" className="hover:text-[#c9a961] transition-colors">Legal Policies</Link>
            <Link href="/intake" className="hover:text-[#c9a961] transition-colors">AI Legal Help</Link>
            <Link href="/resources" className="text-[#c9a961] font-semibold">Legal Resources</Link>
            <Link href="/#contact" className="hover:text-[#c9a961] transition-colors">Contact Us</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">Login</Link>
            <Link href="/intake" className="text-sm px-4 py-2 rounded-lg bg-[#c9a961] text-[#0f2b46] font-semibold hover:bg-[#d4b872] transition-colors">Get Help</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0f2b46] text-white pb-12 pt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Legal Resources</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Free legal information, templates, and tools to help you understand and protect your rights under South African law.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#c9a961] text-[#0f2b46]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-[#0f2b46]/20' : 'bg-white/10'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* ═══ LEGAL ARTICLES ═══ */}
        {activeTab === 'articles' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Legal Articles & Guides</h2>
              <p className="text-gray-500">Expert legal information written for everyday South Africans</p>
            </div>
            <div className="space-y-4">
              {LEGAL_ARTICLES.map((article) => (
                <div key={article.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <button
                    onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                    className="w-full text-left p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-[#0f2b46]/10 text-[#0f2b46] rounded-full">{article.category}</span>
                          <span className="text-xs text-gray-400">{article.readTime} read</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{new Date(article.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0f2b46] mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-500">{article.excerpt}</p>
                      </div>
                      <span className={`text-[#c9a961] text-xl mt-2 transition-transform ${expandedArticle === article.id ? 'rotate-45' : ''}`}>+</span>
                    </div>
                  </button>
                  {expandedArticle === article.id && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="pt-4 prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                        {article.content}
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">Disclaimer: This information is for general guidance only and does not constitute legal advice.</p>
                        <Link href="/intake" className="text-sm font-semibold text-[#c9a961] hover:text-[#0f2b46] transition-colors">
                          Need help with this? Start AI Intake →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CONTRACT TEMPLATES ═══ */}
        {activeTab === 'templates' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Contract Templates</h2>
              <p className="text-gray-500">South African law-compliant templates — review the key sections included in each</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {CONTRACT_TEMPLATES.map((template) => (
                <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📋</span>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-[#c9a961]/20 text-[#78621e] rounded-full">{template.category}</span>
                      {unlockedTemplates.includes(template.id) && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Unlocked</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#0f2b46] mb-1">{template.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                        className="text-sm font-semibold text-[#c9a961] hover:text-[#0f2b46] transition-colors"
                      >
                        {expandedTemplate === template.id ? 'Hide Sections ▲' : 'View Sections ▼'}
                      </button>
                      {!unlockedTemplates.includes(template.id) && (
                        <button
                          onClick={() => openEmailGate(template.id)}
                          className="text-sm font-semibold text-[#0f2b46] bg-[#0f2b46]/10 px-3 py-1.5 rounded-lg hover:bg-[#0f2b46]/20 transition-colors flex items-center gap-1"
                        >
                          🔒 Download Template
                        </button>
                      )}
                    </div>

                    {expandedTemplate === template.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Sections Included:</p>
                        <ol className="space-y-1.5">
                          {template.sections.map((section, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-[#c9a961] font-bold text-xs mt-0.5">{i + 1}.</span>
                              {section}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{template.sections.length} sections</span>
                    <Link href="/intake" className="text-xs font-semibold text-[#0f2b46] hover:text-[#c9a961] bg-[#0f2b46]/10 px-3 py-1.5 rounded-lg transition-colors">
                      Request Custom Draft →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-[#0f2b46] rounded-xl p-6 text-center text-white">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Need a Customised Contract?</h3>
              <p className="text-white/70 text-sm mb-4">Our legal advisors can draft, review, or customise any legal document for your specific needs.</p>
              <Link href="/intake" className="inline-block px-6 py-2.5 bg-[#c9a961] text-[#0f2b46] font-semibold rounded-lg hover:bg-[#d4b872] transition-colors text-sm">
                Request Legal Document →
              </Link>
            </div>
          </div>
        )}

        {/* ═══ FAQs ═══ */}
        {activeTab === 'faqs' && (
          <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Frequently Asked Questions</h2>
                <p className="text-gray-500">Quick answers to common legal and account questions</p>
              </div>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-72 focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {faqCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFaqFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                    faqFilter === cat
                      ? 'bg-[#0f2b46] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredFaqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-semibold px-2 py-1 bg-[#0f2b46]/10 text-[#0f2b46] rounded-full whitespace-nowrap">{faq.category}</span>
                      <span className="text-sm font-semibold text-[#0f2b46]">{faq.q}</span>
                    </div>
                    <span className={`text-[#c9a961] text-lg transition-transform ${expandedFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {expandedFaq === i && (
                    <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <span className="text-4xl block mb-3">🔍</span>
                  No questions found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CLAIM FORMS ═══ */}
        {activeTab === 'claims' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0f2b46] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Claim Forms & Applications</h2>
              <p className="text-gray-500">Information on official South African legal claim forms, requirements, and filing deadlines</p>
            </div>
            <div className="space-y-4">
              {CLAIM_FORMS.map((form) => (
                <div key={form.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0f2b46] flex items-center justify-center text-white text-xl flex-shrink-0">📄</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#0f2b46] mb-1">{form.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{form.description}</p>
                      
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Required Documents</p>
                          <ul className="space-y-1">
                            {form.requirements.map((req, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-[#c9a961] mt-0.5">✓</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Filing Deadline</p>
                          <p className="text-sm text-[#0f2b46] font-semibold">{form.deadline}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Where to File</p>
                          <p className="text-sm text-[#0f2b46] font-semibold">{form.filing}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Need assistance filing this claim?</span>
                    <Link href="/intake" className="text-sm font-semibold text-white bg-[#0f2b46] px-4 py-2 rounded-lg hover:bg-[#1a3d5c] transition-colors">
                      Get Legal Help →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-[#0f2b46] mb-1">Important Notice</h4>
                  <p className="text-sm text-gray-600">
                    Filing deadlines are strict in South African law. Missing a deadline may result in your claim being permanently barred (prescribed). 
                    If you are unsure about your deadline, contact us immediately through our <Link href="/intake" className="text-[#c9a961] font-semibold hover:underline">AI Legal Intake</Link> for a free assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <section className="bg-[#0f2b46] py-10">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Still Have Questions?</h2>
          <p className="text-white/60 text-sm mb-6">Our AI-powered legal intake can assess your situation in under 5 minutes — completely free.</p>
          <div className="flex justify-center gap-3">
            <Link href="/intake" className="px-6 py-3 bg-[#c9a961] text-[#0f2b46] rounded-lg font-semibold text-sm hover:bg-[#d4b872] transition-colors">
              Start Free AI Intake →
            </Link>
            <Link href="/#contact" className="px-6 py-3 border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1f33] text-white/50 py-6 text-center text-xs">
        <p>© {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.</p>
        <p className="mt-1">The information on this website is for general guidance only and does not constitute legal advice.</p>
      </footer>
    </div>
  )
}


export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg text-gray-500">Loading resources...</div></div>}>
      <ResourcesPageContent />
    </Suspense>
  )
}
