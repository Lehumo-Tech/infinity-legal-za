export const MEMBERS = [
  { id: 'MEM-001', email: 'member@demo.com', password: 'demo123', name: 'Thabo Mbeki', phone: '+27 82 123 4567', plan: 'premium', planPrice: 115, status: 'active', joinDate: '2026-01-15', benefitsRemaining: { consults: 3, documents: 5 }, billingDay: 15 },
  { id: 'MEM-002', email: 'nomsa@demo.com', password: 'demo123', name: 'Nomsa Dlamini', phone: '+27 83 234 5678', plan: 'basic', planPrice: 95, status: 'active', joinDate: '2026-02-01', benefitsRemaining: { consults: 1, documents: 2 }, billingDay: 1 },
  { id: 'MEM-003', email: 'peter@demo.com', password: 'demo123', name: 'Peter Naidoo', phone: '+27 84 345 6789', plan: 'business', planPrice: 130, status: 'active', joinDate: '2026-01-20', benefitsRemaining: { consults: 15, documents: 20 }, billingDay: 20 },
]

export const REQUESTS = [
  { id: 'REQ-001', memberId: 'MEM-001', memberName: 'Thabo Mbeki', category: 'Employment', subject: 'Unfair dismissal consultation', description: 'I was terminated without proper procedure. Need advice on CCMA case.', urgency: 'high', status: 'assigned', assignedTo: 'Adv. Sarah Johnson', createdDate: '2026-03-10', updatedDate: '2026-03-12', resolvedDate: null },
  { id: 'REQ-002', memberId: 'MEM-001', memberName: 'Thabo Mbeki', category: 'Property', subject: 'Lease dispute', description: 'Landlord refusing to return deposit.', urgency: 'medium', status: 'in_progress', assignedTo: 'Adv. Sarah Johnson', createdDate: '2026-02-15', updatedDate: '2026-03-01', resolvedDate: null },
  { id: 'REQ-003', memberId: 'MEM-002', memberName: 'Nomsa Dlamini', category: 'Family', subject: 'Maintenance claim', description: 'Need help filing maintenance claim against ex-spouse.', urgency: 'high', status: 'pending', assignedTo: null, createdDate: '2026-03-13', updatedDate: '2026-03-13', resolvedDate: null },
  { id: 'REQ-004', memberId: 'MEM-003', memberName: 'Peter Naidoo', category: 'Corporate', subject: 'Contract review', description: 'Need supplier agreement reviewed before signing.', urgency: 'low', status: 'resolved', assignedTo: 'Adv. Michael Chen', createdDate: '2026-02-01', updatedDate: '2026-02-10', resolvedDate: '2026-02-10' },
  { id: 'REQ-005', memberId: 'MEM-002', memberName: 'Nomsa Dlamini', category: 'Consumer', subject: 'Defective product', description: 'Bought appliance that stopped working after 2 weeks. Store refusing refund.', urgency: 'medium', status: 'assigned', assignedTo: 'Adv. Michael Chen', createdDate: '2026-03-05', updatedDate: '2026-03-08', resolvedDate: null },
]

export const STAFF = [
  { id: 'STAFF-001', email: 'tsatsi@infinitylegal.org', password: 'demo123', name: 'Tidimalo Tsatsi', role: 'admin', status: 'active', lastLogin: '2026-03-14' },
  { id: 'STAFF-002', email: 'attorney@infinitylegal.org', password: 'demo123', name: 'Adv. Sarah Johnson', role: 'attorney', status: 'active', lastLogin: '2026-03-14' },
  { id: 'STAFF-003', email: 'chen@infinitylegal.org', password: 'demo123', name: 'Adv. Michael Chen', role: 'attorney', status: 'active', lastLogin: '2026-03-13' },
]

export const PLANS = [
  { id: 'basic', name: 'Basic', price: 95, benefits: { consultsPerMonth: 2, documentReview: true, courtRepresentation: false, emailSupport: true, prioritySupport: false, dedicatedAttorney: false, contractReview: false, complianceAudit: false }, features: ['2 consultations per month', 'Email support', 'Document review', 'Legal resource library', 'Basic contract templates'] },
  { id: 'premium', name: 'Premium', price: 115, popular: true, benefits: { consultsPerMonth: -1, documentReview: true, courtRepresentation: true, emailSupport: true, prioritySupport: true, dedicatedAttorney: false, contractReview: true, complianceAudit: false }, features: ['Unlimited consultations', 'Priority support', 'Court representation', 'Document drafting', 'Contract review', 'CCMA representation', '24/7 emergency line'] },
  { id: 'business', name: 'Business', price: 130, benefits: { consultsPerMonth: -1, documentReview: true, courtRepresentation: true, emailSupport: true, prioritySupport: true, dedicatedAttorney: true, contractReview: true, complianceAudit: true }, features: ['Everything in Premium', 'Dedicated attorney', 'Compliance audit', 'Board resolutions', 'Employment contracts', 'Regulatory filings', 'Monthly legal report'] },
]

export const SCRAPED_LEADS = [
  { id: 'LEAD-001', name: 'Sipho Mthembu', source: 'LinkedIn', url: 'linkedin.com/in/sipho-m', category: 'Employment', signal: 'Posted about unfair dismissal from mining company', email: 'sipho.m@gmail.com', phone: '+27 71 456 7890', location: 'Johannesburg', score: 92, date: '2026-03-14', status: 'new' },
  { id: 'LEAD-002', name: 'Zanele Khumalo', source: 'Twitter/X', url: 'x.com/zanele_k', category: 'Consumer', signal: 'Tweeted about insurance claim being denied unfairly', email: null, phone: null, location: 'Durban', score: 78, date: '2026-03-13', status: 'contacted' },
  { id: 'LEAD-003', name: 'André van der Merwe', source: 'Facebook', url: 'fb.com/andre.vdm', category: 'Property', signal: 'Posted in tenant rights group about eviction notice', email: 'andre.vdm@outlook.com', phone: '+27 82 567 8901', location: 'Cape Town', score: 85, date: '2026-03-13', status: 'new' },
  { id: 'LEAD-004', name: 'Priya Govender', source: 'Google Reviews', url: 'google.com/maps', category: 'Family', signal: 'Left review mentioning divorce and child custody battle', email: 'priya.g@yahoo.com', phone: null, location: 'Pretoria', score: 70, date: '2026-03-12', status: 'qualified' },
  { id: 'LEAD-005', name: 'Bongani Ndlovu', source: 'Reddit', url: 'reddit.com/u/bongani_nd', category: 'Criminal', signal: 'Posted in r/southafrica about wrongful arrest', email: null, phone: null, location: 'Bloemfontein', score: 65, date: '2026-03-12', status: 'new' },
  { id: 'LEAD-006', name: 'Fatima Ebrahim', source: 'LinkedIn', url: 'linkedin.com/in/fatima-e', category: 'Employment', signal: 'Shared article about CCMA process, mentioned personal experience', email: 'f.ebrahim@company.co.za', phone: '+27 83 678 9012', location: 'Sandton', score: 88, date: '2026-03-11', status: 'contacted' },
  { id: 'LEAD-007', name: 'Johan Botha', source: 'News Comments', url: 'news24.com', category: 'Property', signal: 'Commented on article about tenant evictions', email: null, phone: null, location: 'Stellenbosch', score: 55, date: '2026-03-10', status: 'new' },
  { id: 'LEAD-008', name: 'Lerato Molefe', source: 'Twitter/X', url: 'x.com/lerato_mol', category: 'Consumer', signal: 'Thread about bank overcharging fees and NCA violations', email: 'lerato.m@gmail.com', phone: '+27 72 789 0123', location: 'Soweto', score: 82, date: '2026-03-10', status: 'qualified' },
]
