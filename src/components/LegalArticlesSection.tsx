'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowUpRight, Clock } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  civil_litigation: { label: 'Civil Litigation', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
  labour_law: { label: 'Labour Law', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  criminal_defence: { label: 'Criminal Defence', color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
  family_law: { label: 'Family Law', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
  corporate_commercial: { label: 'Corporate', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },
  property_conveyancing: { label: 'Property', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  estate_planning: { label: 'Estate Planning', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100' },
  debt_recovery: { label: 'Debt Recovery', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
  consumer_rights: { label: 'Consumer Rights', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100' },
  popia_compliance: { label: 'POPIA', color: 'text-[#a88832]', bg: 'bg-[#fdf8ed] border-[#e8e2d4]' },
  immigration: { label: 'Immigration', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
  general: { label: 'General', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
};

// Static fallback articles — shown when the database table doesn't exist yet
const staticArticles = [
  {
    id: 'static-1',
    slug: 'understanding-your-rights-under-popia',
    title: 'Understanding Your Rights Under POPIA',
    subtitle: 'A comprehensive guide to South Africa\'s Protection of Personal Information Act',
    summary: 'A comprehensive guide to South Africa\'s Protection of Personal Information Act — your 8 rights and how to exercise them.',
    category: 'popia_compliance',
    tags: ['POPIA', 'data protection', 'privacy rights'],
    reading_time_min: 6,
    is_featured: true,
    is_published: true,
    published_at: new Date().toISOString(),
    content: '# Understanding Your Rights Under POPIA\n\nThe Protection of Personal Information Act (POPIA) is South Africa\'s comprehensive data protection law that gives you rights over how your personal information is collected, used, stored, and shared.\n\n## Your 8 Rights Under POPIA\n\n1. **Right to Access** — Request your personal information from any organisation\n2. **Right to Correction** — Correct inaccurate or outdated information\n3. **Right to Object** — Object to processing of your information\n4. **Right to Withdraw Consent** — Withdraw consent at any time\n5. **Right to Complain** — Lodge a complaint with the Information Regulator\n6. **Right to Not Have Data Processed** — Restrict processing beyond your consent\n7. **Right to Not Be Subject to Automated Decisions** — Not subject to purely automated decisions\n8. **Right to Data Portability** — Receive your data in a structured format\n\n*This article is for informational purposes only and does not constitute legal advice.*',
  },
  {
    id: 'static-2',
    slug: 'what-to-do-if-you-are-unfairly-dismissed',
    title: 'What to Do If You Are Unfairly Dismissed',
    subtitle: 'Your step-by-step guide to CCMA referrals and labour rights in South Africa',
    summary: 'Step-by-step guide to CCMA referrals and labour rights — including the critical 30-day deadline.',
    category: 'labour_law',
    tags: ['unfair dismissal', 'CCMA', 'labour law', 'LRA'],
    reading_time_min: 8,
    is_featured: true,
    is_published: true,
    published_at: new Date().toISOString(),
    content: '# What to Do If You Are Unfairly Dismissed\n\nUnfair dismissal is one of the most common labour disputes in South Africa. The Labour Relations Act (LRA) protects employees from being fired without fair reason and proper procedure.\n\n## The 30-Day Rule\n\n**Critical:** You only have **30 days** from the date of dismissal to refer a dispute to the CCMA.\n\n## Steps to Take\n\n1. **Get Your Dismissal in Writing** — Your employer is legally required to provide this\n2. **Gather Evidence** — Employment contract, payslips, written warnings, communications\n3. **Refer to the CCMA** — Submit form LRA 7.11 within 30 days\n4. **Conciliation** — A commissioner helps both parties reach a settlement\n5. **Arbitration** — If conciliation fails, a binding decision is made\n\n## Possible Outcomes\n- **Reinstatement** — Get your job back\n- **Compensation** — Up to 12 months\' salary\n\n*This article is for informational purposes only and does not constitute legal advice.*',
  },
  {
    id: 'static-3',
    slug: 'your-consumer-rights-in-south-africa',
    title: 'Your Consumer Rights in South Africa',
    subtitle: 'How the Consumer Protection Act shields you from unfair business practices',
    summary: 'How the Consumer Protection Act shields you from unfair business practices — your 9 fundamental rights explained.',
    category: 'consumer_rights',
    tags: ['consumer rights', 'CPA', 'Consumer Protection Act'],
    reading_time_min: 7,
    is_featured: true,
    is_published: true,
    published_at: new Date().toISOString(),
    content: '# Your Consumer Rights in South Africa\n\nThe Consumer Protection Act (CPA) of 2008 gives you 9 fundamental rights:\n\n1. **Right to Equality** — No discrimination\n2. **Right to Privacy** — Refuse unwanted marketing\n3. **Right to Choose** — Cancel agreements with 20 days\' notice\n4. **Right to Information** — Clear pricing and terms\n5. **Right to Fair Value** — Honest advertising and fair pricing\n6. **Right to Safety** — Safe products with warnings\n7. **Right to Fair Contract Terms** — No unfair clauses\n8. **Right to Fair Marketing** — No bait marketing or pyramid schemes\n9. **Right to Accountability** — Honour warranties\n\n**Key facts:** Return defective goods within **6 months**. Cooling-off period: **5 business days** for direct marketing.\n\n*This article is for informational purposes only and does not constitute legal advice.*',
  },
  {
    id: 'static-4',
    slug: 'guide-to-south-african-divorce-law',
    title: 'Guide to South African Divorce Law',
    subtitle: 'What you need to know about divorce proceedings, maintenance, and custody',
    summary: 'What you need to know about divorce proceedings, asset division, maintenance, and child custody in South Africa.',
    category: 'family_law',
    tags: ['divorce', 'family law', 'custody', 'maintenance'],
    reading_time_min: 9,
    is_featured: false,
    is_published: true,
    published_at: new Date().toISOString(),
    content: '# Guide to South African Divorce Law\n\nSouth African law recognises one ground for divorce: the **irretrievable breakdown** of the marriage.\n\n## Division of Assets\n- **In community of property** — Split 50/50\n- **Out of community (without accrual)** — Each keeps their own\n- **Out of community (with accrual)** — Share the growth difference\n\n## The Process\n1. Summons → 2. Response → 3. Discovery → 4. Mediation → 5. Trial → 6. Decree\n\n*This article is for informational purposes only and does not constitute legal advice.*',
  },
  {
    id: 'static-5',
    slug: 'renters-rights-under-the-rental-housing-act',
    title: 'Your Rights as a Tenant in South Africa',
    subtitle: 'Know what your landlord can and cannot do under the Rental Housing Act',
    summary: 'Know what your landlord can and cannot do — unlawful eviction, deposits, and repairs.',
    category: 'civil_litigation',
    tags: ['tenant rights', 'rental housing', 'eviction'],
    reading_time_min: 7,
    is_featured: false,
    is_published: true,
    published_at: new Date().toISOString(),
    content: '# Your Rights as a Tenant\n\n- **Right to a Written Lease** — Must state rent, deposit, and terms\n- **Right to a Habitable Dwelling** — Working plumbing, structural integrity\n- **Right Against Unlawful Eviction** — No eviction without a court order (PIE Act)\n- **Right to Privacy** — 24-48 hours notice before entry\n- **Right to Fair Deposit Handling** — Refunded within 7-21 days\n\n**Rental Housing Tribunal**: 0800 11 22 33\n\n*This article is for informational purposes only and does not constitute legal advice.*',
  },
  {
    id: 'static-6',
    slug: 'debt-review-and-debt-counselling-explained',
    title: 'Debt Review and Debt Counselling Explained',
    subtitle: 'How the National Credit Act protects over-indebted South Africans',
    summary: 'How the National Credit Act protects over-indebted South Africans through debt review and counselling.',
    category: 'debt_recovery',
    tags: ['debt review', 'NCA', 'debt counselling'],
    reading_time_min: 6,
    is_featured: false,
    is_published: true,
    published_at: new Date().toISOString(),
    content: '# Debt Review Explained\n\nDebt review (debt counselling) is a formal legal process under the NCA where a registered counsellor negotiates with creditors for:\n- Reduced monthly payments\n- Extended payment terms\n- Lower interest rates\n\n## Key Protections\n- **No legal action** from creditors while under debt review\n- **No asset repossession** — Home and car are protected\n- **No harassment** — Creditors must communicate through your counsellor\n\n*This article is for informational purposes only and does not constitute legal advice.*',
  },
];

// Render markdown-ish content as HTML (skip first h1 since we display title separately)
function renderContent(content: string | undefined | null) {
  if (!content) return '<p class="text-slate-400">Article content loading...</p>';
  const withoutFirstH1 = content.replace(/^#\s+.*\n?/, '');
  return withoutFirstH1
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-[#0c1e3c] mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-[#0c1e3c] mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-[#0c1e3c] mt-4 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-[#0c1e3c]">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 text-slate-600 text-sm leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 text-slate-600 text-sm leading-relaxed"><span class="font-medium text-[#0c1e3c]">$1.</span> $2</li>')
    .replace(/\n\n/g, '<div class="h-3"></div>')
    .replace(/\n/g, '<br/>');
}

export default function LegalArticlesSection() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [fullArticle, setFullArticle] = useState<any>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/articles?limit=20');
        const data = await res.json();
        if (data.success && data.data?.articles?.length > 0) {
          setArticles(data.data.articles);
        } else {
          setArticles(staticArticles);
        }
      } catch {
        setArticles(staticArticles);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const featuredArticles = articles.filter(a => a.is_featured);
  const regularArticles = articles.filter(a => !a.is_featured);

  // Fetch full article when expanding
  useEffect(() => {
    if (!expandedArticle) { setFullArticle(null); return; }
    const existing = articles.find(a => a.slug === expandedArticle);
    if (existing?.content) { setFullArticle(existing); return; }
    setLoadingArticle(true);
    fetch(`/api/articles?slug=${expandedArticle}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) setFullArticle(data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingArticle(false));
  }, [expandedArticle, articles]);

  // Article detail modal
  if (expandedArticle) {
    const article = fullArticle || articles.find(a => a.slug === expandedArticle);
    if (article) {
      const catMeta = CATEGORY_META[article.category] || CATEGORY_META.general;
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setExpandedArticle(null)}
            className="flex items-center gap-2 text-[#a88832] hover:text-[#8a6e28] text-sm font-medium mb-8 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 rotate-180" />
            Back to all articles
          </button>
          <article className="max-w-3xl mx-auto">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider mb-5 ${catMeta.bg} ${catMeta.color}`}>
              {catMeta.label}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight leading-tight">{article.title}</h1>
            {article.subtitle && (
              <p className="mt-3 text-lg text-slate-500 leading-relaxed">{article.subtitle}</p>
            )}
            <div className="flex items-center gap-4 mt-5 text-sm text-slate-400">
              {article.reading_time_min && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {article.reading_time_min} min read
                </span>
              )}
              {article.published_at && (
                <span>{new Date(article.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
            </div>
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">{tag}</span>
                ))}
              </div>
            )}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
              />
            </div>
          </article>
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mb-14">
        <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">Legal Knowledge</span>
        <h2 id="articles-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight mt-3 leading-tight">
          Know your rights.<br />Read the law.
        </h2>
        <p className="mt-4 text-slate-500 text-base leading-relaxed">
          Free legal articles written for South Africans. Understand your rights under POPIA, the LRA, the CPA, and more.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-20 mb-3" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-full mb-1" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-[13px] text-slate-500">Legal articles coming soon.</p>
        </div>
      ) : (
        <>
          {/* Featured articles — larger cards */}
          {featuredArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {featuredArticles.map(article => {
                const catMeta = CATEGORY_META[article.category] || CATEGORY_META.general;
                return (
                  <article
                    key={article.id}
                    onClick={() => setExpandedArticle(article.slug)}
                    className="group relative overflow-hidden rounded-2xl bg-[#f7f8fa] border border-slate-200 hover:border-[#c9a84c]/30 hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="p-6 sm:p-8">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider mb-4 ${catMeta.bg} ${catMeta.color}`}>
                        {catMeta.label}
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg sm:text-xl font-bold text-[#0c1e3c] leading-tight group-hover:text-[#a88832] transition-colors">
                          {article.title}
                        </h3>
                        <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-[#c9a84c] flex-shrink-0 mt-1 transition-colors" />
                      </div>
                      {article.subtitle && (
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{article.subtitle}</p>
                      )}
                      <div className="flex items-center gap-4 mt-4 text-[12px] text-slate-400">
                        {article.reading_time_min && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {article.reading_time_min} min read
                          </span>
                        )}
                        {article.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Regular articles — smaller cards */}
          {regularArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularArticles.map(article => {
                const catMeta = CATEGORY_META[article.category] || CATEGORY_META.general;
                return (
                  <article
                    key={article.id}
                    onClick={() => setExpandedArticle(article.slug)}
                    className="group relative rounded-xl bg-white border border-slate-200 hover:border-[#c9a84c]/30 hover:shadow-lg hover:shadow-slate-100/50 p-5 transition-all duration-300 cursor-pointer"
                  >
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-semibold uppercase tracking-wider mb-3 ${catMeta.bg} ${catMeta.color}`}>
                      {catMeta.label}
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#0c1e3c] leading-snug group-hover:text-[#a88832] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="mt-2 text-[13px] text-slate-500 leading-relaxed line-clamp-2">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                      {article.reading_time_min && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.reading_time_min} min
                        </span>
                      )}
                      {article.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{tag}</span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
