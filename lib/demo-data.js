export const CORE_BENEFITS = [
  'Legal advice and assistance',
  'Access to legal specialists',
  '24-hour Legal Contact Centre',
  'Unlimited legal consultations',
  'Free last will and testament',
  '31-day review period',
  'Plan includes main member, spouse/life partner, and children under 21',
  'Premium waiver up to 12 months (retrenchment/disability)',
]

export const PLANS = [
  {
    id: 'civil',
    name: 'Civil Legal Plan',
    price: 99,
    emoji: '⚖️',
    billingPeriod: 'monthly',
    features: [
      'Contract disputes',
      'Consumer rights complaints',
      'Property & conveyancing advisory',
      'Debt collection assistance',
      'Defamation claims',
      'Small claims assistance',
      'Personal income tax advice',
    ],
    coverage: {
      included: [
        'Contract disputes',
        'Consumer rights complaints',
        'Property & conveyancing advisory',
        'Debt collection assistance',
        'Defamation claims',
        'Small claims assistance',
      ],
      excluded: [
        'Labour/employment matters',
        'Criminal matters',
        'Matters arising before membership',
      ],
    },
    additionalBenefits: ['Personal income tax advice'],
  },
  {
    id: 'labour',
    name: 'Labour Legal Plan',
    price: 99,
    emoji: '💼',
    popular: true,
    billingPeriod: 'monthly',
    features: [
      'Unfair dismissal disputes',
      'CCMA representation & arbitration',
      'Workplace discrimination claims',
      'Employment contract reviews',
      'Disciplinary hearing assistance',
      'Retrenchment consultation support',
      'Personal income tax advice',
    ],
    coverage: {
      included: [
        'Unfair dismissal disputes',
        'CCMA representation & arbitration',
        'Workplace discrimination claims',
        'Employment contract reviews',
        'Disciplinary hearing assistance',
        'Retrenchment consultation support',
      ],
      excluded: [
        'Civil matters',
        'Criminal matters',
        'Matters arising before membership',
      ],
    },
    additionalBenefits: ['Personal income tax advice'],
  },
  {
    id: 'extensive',
    name: 'Extensive Plan',
    price: 139,
    emoji: '🌟',
    billingPeriod: 'monthly',
    features: [
      'All Civil + Labour matters',
      'Criminal matters & bail applications',
      'Traffic offence defence',
      'Domestic violence protection orders',
      'Tax advice + submission services',
      'Antenuptial contract services',
      'Conveyancing discount',
      'Priority case handling',
    ],
    coverage: {
      included: [
        'All Civil matters (as per Civil Plan)',
        'All Labour matters (as per Labour Plan)',
        'Criminal: Bail applications',
        'Criminal: Scheduled offences',
        'Criminal: Traffic offence defence',
        'Criminal: Domestic violence protection orders',
      ],
      excluded: [
        'Matters arising before membership',
        'Frivolous claims',
      ],
    },
    additionalBenefits: [
      'Personal income tax advice AND submission services',
      'Antenuptial contract drafting, lodgement, execution',
      'Discount on property conveyancing fees',
      'Priority case handling',
    ],
  },
]

export const PLAN_DISCLAIMER = "All plans include unlimited legal consultations, 24-hour contact centre, free will, and family plan. 30-day waiting period for pre-existing matters. Process: Contact 24/7 centre → matter logged → specialist assigned within 24 hours."

export const MEMBERS = [
  { id: 'MEM-001', email: 'member@demo.com', password: 'demo123', name: 'Thabo Mbeki', phone: '+27 82 123 4567', plan: 'labour', planName: 'Labour Legal Plan', planPrice: 99, status: 'active', joinDate: '2026-01-15', billingDay: 15 },
  { id: 'MEM-002', email: 'nomsa@demo.com', password: 'demo123', name: 'Nomsa Dlamini', phone: '+27 83 234 5678', plan: 'civil', planName: 'Civil Legal Plan', planPrice: 99, status: 'active', joinDate: '2026-02-01', billingDay: 1 },
  { id: 'MEM-003', email: 'peter@demo.com', password: 'demo123', name: 'Peter Naidoo', phone: '+27 84 345 6789', plan: 'extensive', planName: 'Extensive Plan', planPrice: 139, status: 'active', joinDate: '2026-01-20', billingDay: 20 },
]

export const STAFF = [
  { id: 'STAFF-001', email: 'tsatsi@infinitylegal.org', password: 'demo123', name: 'Tidimalo Tsatsi', role: 'admin', title: 'CEO & Founder' },
  { id: 'STAFF-002', email: 'advisor@infinitylegal.org', password: 'demo123', name: 'Adv. Sarah Johnson', role: 'legal_advisor', title: 'Senior Legal Advisor' },
  { id: 'STAFF-003', email: 'themba@infinitylegal.org', password: 'demo123', name: 'Themba Moyo', role: 'legal_advisor', title: 'Legal Advisor' },
]

export const REQUESTS = [
  { id: 'REQ-001', memberId: 'MEM-001', subject: 'Unfair dismissal consultation', category: 'Labour', status: 'in_progress', priority: 'high', assignedTo: 'STAFF-002', createdAt: '2026-03-15', description: 'Terminated without proper hearing process.' },
  { id: 'REQ-002', memberId: 'MEM-002', subject: 'Lease deposit dispute', category: 'Civil', status: 'in_progress', priority: 'medium', assignedTo: 'STAFF-003', createdAt: '2026-03-18', description: 'Landlord refusing to return deposit after lease end.' },
  { id: 'REQ-003', memberId: 'MEM-001', subject: 'CCMA referral preparation', category: 'Labour', status: 'new', priority: 'high', assignedTo: 'STAFF-002', createdAt: '2026-03-20', description: 'Need help preparing CCMA referral documentation.' },
  { id: 'REQ-004', memberId: 'MEM-003', subject: 'Bail application assistance', category: 'Criminal', status: 'resolved', priority: 'high', assignedTo: 'STAFF-002', createdAt: '2026-03-10', description: 'Family member arrested, need bail application.' },
  { id: 'REQ-005', memberId: 'MEM-002', subject: 'Consumer complaint — defective goods', category: 'Civil', status: 'new', priority: 'medium', assignedTo: 'STAFF-003', createdAt: '2026-03-22', description: 'Purchased item defective, store refusing refund.' },
]

export const SCRAPED_LEADS = [
  { id: 'LEAD-001', name: 'Sipho Mabena', source: 'LinkedIn', category: 'Labour', score: 92, date: '2026-03-20', status: 'new', snippet: 'Posted about unfair dismissal from mining company' },
  { id: 'LEAD-002', name: 'Zanele Khumalo', source: 'Twitter/X', category: 'Consumer', score: 78, date: '2026-03-19', status: 'contacted', snippet: 'Tweeted about defective product, no refund from retailer' },
  { id: 'LEAD-003', name: 'André van der Merwe', source: 'Facebook', category: 'Property', score: 85, date: '2026-03-18', status: 'qualified', snippet: 'Seeking help with tenant eviction dispute' },
  { id: 'LEAD-004', name: 'Palesa Molefe', source: 'LinkedIn', category: 'Labour', score: 88, date: '2026-03-15', status: 'new', snippet: 'Reported workplace discrimination and harassment' },
  { id: 'LEAD-005', name: 'Ravi Chetty', source: 'Google', category: 'Civil', score: 82, date: '2026-03-10', status: 'qualified', snippet: 'Searching for contract dispute legal advice' },
]
