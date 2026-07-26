/**
 * Fallback articles — real, published legal articles.
 *
 * Used by /api/articles and /api/articles/[slug] when the database is
 * unreachable (serverless cold start, Neon idle reaping, missing
 * DATABASE_URL on Vercel, etc.) so visitors ALWAYS see the articles
 * section populated and can read full content when clicking a card.
 *
 * Values mirror the seeded articles in the database exactly. When the
 * DB connection is healthy, the routes serve live DB data (including
 * any admin edits) instead.
 */

export interface FallbackArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  author_id: string | null;
  reading_time_min: number;
  view_count: number;
  is_published: boolean;
  is_featured: boolean;
  published_at: string;
  sort_order: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const PUBLISHED = '2026-07-23T17:23:02.000Z';

export const FALLBACK_ARTICLES: FallbackArticle[] = [
  {
    id: 'fallback-article-consumer-rights',
    slug: 'your-consumer-rights-in-south-africa',
    title: 'Your Consumer Rights in South Africa',
    subtitle: 'The Consumer Protection Act gives you 9 fundamental rights — here is how to use them.',
    summary:
      'A plain-language guide to your 9 fundamental consumer rights under the CPA, including returns, cancellations, and the cooling-off period.',
    content: `# Your Consumer Rights in South Africa

The Consumer Protection Act (CPA) of 2008 is one of the most powerful pieces of legislation protecting South African consumers. Understanding your rights can save you money and prevent exploitation.

## Your 9 Fundamental Consumer Rights

### 1. Right to Equality
No supplier may discriminate against you based on race, gender, age, or disability when providing goods or services.

### 2. Right to Privacy
You have the right to refuse unwanted direct marketing, opt out of marketing communications, and not be required to buy something as a condition of buying something else.

### 3. Right to Choose
You can cancel a fixed-term agreement with 20 business days' notice, return defective goods within 6 months, and cancel advance bookings with reasonable notice.

### 4. Right to Information
Suppliers must provide clear pricing in ZAR, product labels in plain language, and full terms and conditions before you sign. You have a right to cancel within the cooling-off period (5 business days for direct marketing).

### 5. Right to Fair Value
You're entitled to fair pricing, honest advertising, and quality goods that last a reasonable time.

### 6. Right to Safety
Products must be safe and carry appropriate warnings. You can sue for harm caused by unsafe products.

### 7. Right to Fair Contract Terms
No unfair, unreasonable, or unjust contract terms. One-sided clauses may be struck down.

### 8. Right to Fair Marketing
No bait marketing, no negative option marketing, and no pyramid schemes.

### 9. Right to Accountability
Suppliers are accountable for honouring warranties, providing after-sales service, and handling complaints promptly.

## Common Scenarios

### Returning a Defective Product
Under the CPA, you can return defective goods within **6 months** for your choice of repair, replacement, or refund.

### Cancelling a Gym Contract
Fixed-term agreements can be cancelled with **20 business days' notice**. You may owe a reasonable cancellation penalty (typically 10-15% of remaining value).

### Cooling-Off Period
If you bought something through direct marketing (phone call, door-to-door), you have **5 business days** to cancel without penalty.

## Where to Complain

1. The supplier directly
2. National Consumer Commission (NCC): 012 394 2000
3. Provincial Consumer Affairs offices
4. Legal consultation for complex matters

*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal legal advisor.*`,
    category: 'consumer_rights',
    tags: ['Consumer Protection Act', 'CPA', 'consumer rights', 'returns', 'cooling-off period'],
    cover_image_url: null,
    author_id: null,
    reading_time_min: 5,
    view_count: 0,
    is_published: true,
    is_featured: true,
    published_at: PUBLISHED,
    sort_order: 1,
    metadata: null,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
  },
  {
    id: 'fallback-article-unfair-dismissal',
    slug: 'what-to-do-if-you-are-unfairly-dismissed',
    title: 'What to Do If You Are Unfairly Dismissed',
    subtitle: 'The Labour Relations Act protects you — but you only have 30 days to act.',
    summary:
      'A step-by-step guide to unfair dismissal under the LRA, including the 30-day CCMA referral deadline and the conciliation/arbitration process.',
    content: `# What to Do If You Are Unfairly Dismissed

Unfair dismissal is one of the most common labour disputes in South Africa. The Labour Relations Act (LRA) protects employees from being fired without fair reason and proper procedure.

## What Counts as Unfair Dismissal?

A dismissal may be unfair if:
- There was no fair reason (substantive fairness)
- Proper procedure was not followed (procedural fairness)
- It was an automatically unfair dismissal

### Automatically Unfair Dismissals
The LRA lists dismissals that are automatically unfair, including:
- Participation in a protected strike
- Pregnancy-related reasons
- Refusal to accept a demand in collective bargaining
- Discrimination based on race, gender, religion, etc.
- Exercising a right under the LRA

## The 30-Day Rule

**Critical:** You only have **30 days** from the date of dismissal to refer a dispute to the CCMA. Missing this deadline can severely affect your case.

## Step-by-Step: Filing a CCMA Referral

### Step 1: Get Your Dismissal in Writing
Request a written notice of dismissal from your employer. They are legally required to provide this.

### Step 2: Gather Evidence
Collect:
- Employment contract
- Payslips
- Written warnings (if any)
- Communication about the dismissal
- Witness contact details

### Step 3: Refer to the CCMA
Complete form LRA 7.11 (Referral of Dispute) and submit it to your nearest CCMA office within 30 days.

### Step 4: Conciliation
The CCMA will schedule a conciliation meeting. A commissioner will try to help you and your employer reach a settlement.

### Step 5: Arbitration
If conciliation fails, the matter goes to arbitration. A commissioner will hear evidence from both sides and make a binding decision.

## Possible Outcomes

If the CCMA finds your dismissal was unfair, they may order:
- **Reinstatement** — you get your job back
- **Re-employment** — you get a similar job
- **Compensation** — up to 12 months' salary
- **Severance pay** — if applicable

## Getting Legal Help

You don't need a legal advisor for CCMA proceedings, but legal representation can significantly improve your chances — especially at arbitration.

*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal legal advisor.*`,
    category: 'labour_law',
    tags: ['Labour Relations Act', 'LRA', 'unfair dismissal', 'CCMA', 'labour law'],
    cover_image_url: null,
    author_id: null,
    reading_time_min: 5,
    view_count: 0,
    is_published: true,
    is_featured: true,
    published_at: PUBLISHED,
    sort_order: 2,
    metadata: null,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
  },
  {
    id: 'fallback-article-popia',
    slug: 'understanding-your-rights-under-popia',
    title: 'Understanding Your Rights Under POPIA',
    subtitle: "South Africa's data protection law gives you 8 rights over your personal information.",
    summary:
      'A plain-language guide to your 8 rights under POPIA, including access, correction, objection, and how to lodge a complaint with the Information Regulator.',
    content: `# Understanding Your Rights Under POPIA

The Protection of Personal Information Act (POPIA) is South Africa's comprehensive data protection law that gives you rights over how your personal information is collected, used, stored, and shared.

## What is POPIA?

POPIA (Act 4 of 2013) came into full effect on 1 July 2021. It regulates the processing of personal information by both public and private bodies in South Africa, inspired by international data protection frameworks.

## Your 8 Rights Under POPIA

### 1. Right to Access
You have the right to request access to your personal information held by any organisation. They must provide it within 30 days.

### 2. Right to Correction
If your personal information is inaccurate, incomplete, or outdated, you can request that it be corrected or deleted.

### 3. Right to Object
You can object to the processing of your personal information in certain circumstances, including for direct marketing purposes.

### 4. Right to Withdraw Consent
If processing is based on your consent, you may withdraw that consent at any time.

### 5. Right to Complain
You can lodge a complaint with the Information Regulator if you believe your personal information has been mishandled.

### 6. Right to Not Have Your Data Processed
You can request that your personal information not be processed for purposes beyond what you consented to.

### 7. Right to Not Be Subject to Automated Decisions
You have the right not to be subject to decisions based solely on automated processing that significantly affect you.

### 8. Right to Data Portability
In certain circumstances, you can request your personal information in a structured, commonly used format.

## What Does This Mean for You?

Organisations must:
- Only collect information they genuinely need
- Tell you why they need it and how they'll use it
- Keep it secure and up to date
- Not keep it longer than necessary
- Get your consent before processing (in most cases)

## Filing a Complaint

If you believe your POPIA rights have been violated, you can:
1. Contact the organisation directly
2. Lodge a complaint with the Information Regulator
3. Seek legal advice

The Information Regulator can be contacted at: inforeg@justice.gov.za

*This article is for informational purposes only and does not constitute legal advice. Consult with a legal advisor for specific guidance.*`,
    category: 'popia_compliance',
    tags: ['POPIA', 'data protection', 'privacy', 'Information Regulator', 'personal information'],
    cover_image_url: null,
    author_id: null,
    reading_time_min: 5,
    view_count: 0,
    is_published: true,
    is_featured: true,
    published_at: PUBLISHED,
    sort_order: 3,
    metadata: null,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
  },
  {
    id: 'fallback-article-debt-review',
    slug: 'debt-review-and-debt-counselling-explained',
    title: 'Debt Review and Debt Counselling Explained',
    subtitle: 'The National Credit Act offers a legal lifeline if you are over-indebted.',
    summary:
      'How debt review works under the NCA: who qualifies, the 6-step process, and the legal protections that stop creditors from taking action against you.',
    content: `# Debt Review and Debt Counselling Explained

If you're struggling with debt, the National Credit Act (NCA) provides a powerful legal protection: **debt review**. This process can help you restructure your debts and protect you from legal action by creditors.

## What is Debt Review?

Debt review (also called debt counselling) is a formal legal process where a registered debt counsellor assesses your financial situation and negotiates with your creditors for reduced monthly payments, extended payment terms, lower interest rates, and waived fees.

## Who Qualifies?

You may qualify for debt review if you are over-indebted (unable to meet all debt obligations on time), earn a regular income, and have not yet been placed under administration or declared bankrupt.

## The Process

1. **Application** — Contact a registered debt counsellor
2. **Assessment** — The counsellor reviews your income, expenses, and debts
3. **Determination** — They determine if you are over-indebted
4. **Proposal** — A repayment plan is sent to all creditors
5. **Court Order** — If creditors don't consent, the counsellor applies to court
6. **Repayment** — You make one affordable monthly payment distributed to creditors

## Important Protections

- **No legal action** — Creditors cannot take legal action against you while under debt review
- **No asset repossession** — Your home and car are protected
- **No more harassment** — Creditors must communicate through your counsellor

*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal legal advisor.*`,
    category: 'debt_recovery',
    tags: ['National Credit Act', 'NCA', 'debt review', 'debt counselling', 'over-indebted'],
    cover_image_url: null,
    author_id: null,
    reading_time_min: 3,
    view_count: 0,
    is_published: true,
    is_featured: false,
    published_at: PUBLISHED,
    sort_order: 4,
    metadata: null,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
  },
  {
    id: 'fallback-article-renters-rights',
    slug: 'renters-rights-under-the-rental-housing-act',
    title: 'Your Rights as a Tenant in South Africa',
    subtitle: 'The Rental Housing Act and CPA protect you from exploitation and unlawful eviction.',
    summary:
      'Key tenant rights under the Rental Housing Act and CPA: written leases, habitable dwellings, deposit handling, and protection from unlawful eviction.',
    content: `# Your Rights as a Tenant in South Africa

The Rental Housing Act and the Consumer Protection Act provide strong protections for tenants in South Africa. Knowing your rights can prevent exploitation and unlawful eviction.

## Key Tenant Rights

- **Right to a Written Lease** — Your landlord must provide a written lease agreement
- **Right to a Habitable Dwelling** — Working plumbing, structural integrity, weatherproofing, reasonable security
- **Right Against Unlawful Eviction** — No one may be evicted without a court order (PIE Act)
- **Right to Privacy** — Your landlord may not enter without reasonable notice
- **Right to Fair Deposit Handling** — Must be held in interest-bearing account, refunded within 7-21 days
- **Right to Fair Rent Increases** — Must be reasonable and stipulated in the lease

## Common Problems & Solutions

**Landlord Won't Fix Things** — Report in writing, arrange repairs and deduct from rent (with proper notice), report to the Rental Housing Tribunal.

**Unlawful Eviction Threats** — Do not leave voluntarily without a court order, contact the Rental Housing Tribunal, seek urgent legal assistance.

**Deposit Not Returned** — Request in writing, lodge a complaint with the Rental Housing Tribunal, consider small claims court (claims under R15,000).

## Useful Contacts

- **Rental Housing Tribunal**: 0800 11 22 33
- **Legal Aid South Africa**: 0800 110 110
- **Infinity Legal**: 068 127 6038

*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal legal advisor.*`,
    category: 'civil_litigation',
    tags: ['Rental Housing Act', 'tenant rights', 'eviction', 'PIE Act', 'lease agreement'],
    cover_image_url: null,
    author_id: null,
    reading_time_min: 3,
    view_count: 0,
    is_published: true,
    is_featured: false,
    published_at: PUBLISHED,
    sort_order: 5,
    metadata: null,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
  },
  {
    id: 'fallback-article-divorce-law',
    slug: 'guide-to-south-african-divorce-law',
    title: 'Guide to South African Divorce Law',
    subtitle: 'Understanding the process, asset division, maintenance, and child custody.',
    summary:
      'A guide to divorce in South Africa: grounds, contested vs uncontested, division of assets, maintenance, child custody, and the 6-step legal process.',
    content: `# Guide to South African Divorce Law

Going through a divorce is one of life's most stressful experiences. Understanding the legal process can help you make informed decisions and protect your interests.

## Grounds for Divorce

South African law recognises one ground for divorce: the **irretrievable breakdown** of the marriage. This can be demonstrated by not living together for 12+ months, adultery, habitual criminality, drug or alcohol addiction, or abuse or desertion.

## Types of Divorce

**Uncontested Divorce** — Both spouses agree on all terms. Faster and more affordable, typically taking 4-8 weeks.

**Contested Divorce** — Spouses disagree on one or more issues. Can take months or even years.

## Key Issues in Divorce

### Division of Assets
- **In community of property** — all assets and debts are split 50/50
- **Out of community of property (without accrual)** — each keeps their own
- **Out of community of property (with accrual)** — the estate that grew more shares the difference

### Maintenance
- **Spousal maintenance** — may be awarded based on need and ability to pay
- **Child maintenance** — both parents must contribute proportionally to their income

### Child Custody
The Children's Act prioritises the **best interests of the child**: primary residence, contact (visitation), and guardianship (decision-making).

## The Process

1. **Summons** — One spouse issues a divorce summons
2. **Response** — The other spouse responds within 10-30 days
3. **Discovery** — Both disclose financial information
4. **Mediation** — Often required before trial
5. **Trial** (if contested) — A judge decides disputed issues
6. **Decree** — The court grants the divorce order

*This article is for informational purposes only and does not constitute legal advice. For case-specific guidance, book a consultation with an Infinity Legal legal advisor.*`,
    category: 'family_law',
    tags: ['divorce', 'family law', 'irretrievable breakdown', 'asset division', 'child custody'],
    cover_image_url: null,
    author_id: null,
    reading_time_min: 4,
    view_count: 0,
    is_published: true,
    is_featured: false,
    published_at: PUBLISHED,
    sort_order: 6,
    metadata: null,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
  },
];

/**
 * Find a fallback article by slug.
 */
export function findFallbackArticle(slug: string): FallbackArticle | undefined {
  return FALLBACK_ARTICLES.find((a) => a.slug === slug);
}
