// South African Legislation Cache — Top 15 Acts
// Cached to minimize API calls. Source: Laws.Africa / SAFLII

export const SA_LEGISLATION = {
  // ═══ LABOUR ═══
  "LRA": {
    fullName: "Labour Relations Act 66 of 1995",
    shortName: "LRA",
    year: 1995,
    category: "labour",
    keywords: ["dismissal", "fired", "unfair dismissal", "ccma", "retrenchment", "strike", "union", "bargaining", "discipline", "disciplinary", "hearing", "dismissed", "employment", "employer", "employee", "labour", "labor", "workplace", "work"],
    sections: {
      "185": { title: "Right not to be unfairly dismissed", text: "Every employee has the right not to be unfairly dismissed or subjected to unfair labour practice.", plain: "Your employer cannot fire you without a valid reason and fair process. If they do, you can take the matter to the CCMA." },
      "186": { title: "Meaning of dismissal", text: "Dismissal means that an employer has terminated a contract of employment with or without notice; or an employee reasonably expected the employer to renew a fixed term contract but the employer offered to renew it on less favourable terms.", plain: "Being 'dismissed' includes being fired, having your contract not renewed when you expected renewal, or being forced to resign because of your employer's conduct (constructive dismissal)." },
      "188": { title: "Other unfair dismissals", text: "A dismissal that is not automatically unfair is unfair if the employer fails to prove that the reason for dismissal is a fair reason related to the employee's conduct or capacity or based on the employer's operational requirements.", plain: "If you are dismissed, your employer must prove the reason was fair (like misconduct, poor performance, or genuine retrenchment) AND that a fair procedure was followed." },
      "189": { title: "Dismissals based on operational requirements", text: "When an employer contemplates dismissing one or more employees for reasons based on the employer's operational requirements, the employer must consult the employees likely to be affected.", plain: "Before retrenching staff, your employer MUST consult with affected employees, consider alternatives, and follow the LIFO (Last In, First Out) principle unless there's a fair reason not to." },
      "191": { title: "Referral to CCMA", text: "If there is a dispute about the fairness of a dismissal, the dismissed employee may refer the dispute in writing to the Commission within 30 days of the date of dismissal.", plain: "You have 30 DAYS from your dismissal date to refer your case to the CCMA. Don't miss this deadline — it's very difficult to get a late referral accepted." },
    }
  },
  "BCEA": {
    fullName: "Basic Conditions of Employment Act 75 of 1997",
    shortName: "BCEA",
    year: 1997,
    category: "labour",
    keywords: ["hours", "overtime", "leave", "annual leave", "sick leave", "maternity", "notice period", "minimum wage", "salary", "wages", "pay", "working hours", "rest", "sunday", "public holiday", "night work"],
    sections: {
      "9": { title: "Ordinary hours of work", text: "An employer may not require or permit an employee to work more than 45 hours in any week and nine hours in any day if the employee works for five days or fewer in a week.", plain: "You cannot be forced to work more than 45 hours per week (9 hours/day for 5-day week, or 8 hours/day for 6-day week). Anything beyond is overtime." },
      "10": { title: "Overtime", text: "An employer may not require or permit an employee to work overtime except by agreement and may not work more than 10 hours overtime per week.", plain: "Overtime is voluntary — your employer cannot force you. Maximum 10 hours overtime per week. Overtime pay is 1.5x your normal rate, or 2x on Sundays." },
      "20": { title: "Annual leave", text: "An employer must grant an employee at least 21 consecutive days' annual leave on full remuneration in respect of each annual leave cycle.", plain: "You're entitled to at least 21 consecutive days (or 15 working days) of paid annual leave per year. Your employer cannot refuse this." },
      "22": { title: "Sick leave", text: "During every sick leave cycle, an employee is entitled to an amount of paid sick leave equal to the number of days the employee would normally work during a period of six weeks.", plain: "Over a 3-year cycle, you get 30 days paid sick leave (for a 5-day worker). For absences longer than 2 days, your employer can require a medical certificate." },
      "25": { title: "Maternity leave", text: "An employee is entitled to at least four consecutive months' maternity leave.", plain: "Pregnant employees get at least 4 months maternity leave. You can start leave 4 weeks before due date. Your employer cannot dismiss you for being pregnant." },
      "37": { title: "Notice of termination", text: "A contract of employment terminable at the instance of a party to the contract may be terminated only on notice of not less than one week during the first six months; two weeks during six months to one year; four weeks after one year.", plain: "Notice periods: 1 week (0-6 months), 2 weeks (6-12 months), 4 weeks (1+ year). Both employer and employee must give notice." },
    }
  },

  // ═══ CIVIL / CONSUMER ═══
  "CPA": {
    fullName: "Consumer Protection Act 68 of 2008",
    shortName: "CPA",
    year: 2008,
    category: "civil",
    keywords: ["consumer", "refund", "return", "defective", "warranty", "product", "goods", "service", "supplier", "store", "shop", "purchase", "buy", "bought", "broken", "faulty", "guarantee", "receipt", "cooling off"],
    sections: {
      "16": { title: "Cooling-off period", text: "A consumer may rescind a transaction resulting from direct marketing within five business days after the later of the date on which the transaction was concluded or the goods were delivered.", plain: "If you bought something through direct marketing (online, phone, door-to-door), you have 5 BUSINESS DAYS to cancel and get a full refund, no questions asked." },
      "20": { title: "Right to return goods", text: "The consumer may return goods to the supplier within 6 months after delivery if the goods are defective, unsuitable for purpose, or not as described.", plain: "You can return faulty goods within 6 MONTHS for a full refund, replacement, or repair — it's YOUR choice, not the store's." },
      "54": { title: "Quality of services", text: "A supplier must perform services in a manner and quality that persons are generally entitled to expect.", plain: "Any service you pay for must be performed to a reasonable standard. If it's not, you can demand it be redone or get a refund." },
      "55": { title: "Consumer's right to safe, good quality goods", text: "Every consumer has a right to receive goods that are reasonably suitable for the purposes for which they are generally intended, of good quality, in good working order, and free of defects.", plain: "Everything you buy must work properly and be safe. If it doesn't, the store MUST fix it, replace it, or refund you within 6 months." },
      "56": { title: "Implied warranty of quality", text: "Every consumer has the right to receive goods that comply with the requirements and standards contemplated in section 55 for a period of 6 months after delivery.", plain: "There's an automatic 6-month warranty on ALL goods by law, even if the store says 'no warranty'. This cannot be waived." },
    }
  },
  "NCA": {
    fullName: "National Credit Act 34 of 2005",
    shortName: "NCA",
    year: 2005,
    category: "civil",
    keywords: ["debt", "credit", "loan", "interest", "debt review", "blacklisted", "debt counselling", "credit score", "credit bureau", "garnish", "attachment", "repossess", "in arrears", "default", "judgment"],
    sections: {
      "86": { title: "Debt review", text: "A consumer who is over-indebted may apply to a debt counsellor to have the consumer declared over-indebted and have the consumer's obligations re-arranged.", plain: "If you can't afford your debts, you can apply for DEBT REVIEW. A debt counsellor will negotiate lower monthly payments with your creditors." },
      "129": { title: "Required procedures before debt enforcement", text: "The credit provider must first deliver a notice to the consumer in writing proposing that the consumer refer the credit agreement to a debt counsellor or resolve any dispute.", plain: "Before a creditor can take legal action against you, they MUST send you a Section 129 letter giving you options like debt review. If they didn't, you may have a defence." },
      "103": { title: "Interest, charges and fees", text: "Despite any provision of law or agreement to the contrary, a credit provider must not charge an amount to a consumer in respect of a credit agreement in excess of the prescribed maximum rates.", plain: "Lenders cannot charge more than the maximum interest rates set by law. If they're overcharging you, the excess is void and can be refunded." },
    }
  },

  // ═══ PROPERTY ═══
  "RHA": {
    fullName: "Rental Housing Act 50 of 1999",
    shortName: "RHA",
    year: 1999,
    category: "civil",
    keywords: ["rent", "landlord", "tenant", "lease", "eviction", "deposit", "rental", "accommodation", "flat", "apartment", "house", "dwelling", "housing", "property", "evict", "maintenance"],
    sections: {
      "4": { title: "Rights of tenants", text: "A tenant has the right to not have the supply of services unreasonably interrupted, and to not have his or her rights in terms of this Act limited.", plain: "Your landlord CANNOT cut your water, electricity, or change locks to force you out — even if you owe rent. This is illegal." },
      "5": { title: "Deposit", text: "A landlord must invest the deposit in an interest-bearing account and provide the tenant with written proof. The deposit plus interest must be refunded within 14 days of lease termination.", plain: "Your deposit MUST earn interest in a separate account. After you move out, the landlord has 14 DAYS to refund it (minus legitimate deductions with proof)." },
      "4(5c)": { title: "Eviction", text: "No tenant may be evicted without a court order, and the tenant must be given the opportunity to make representations to the court.", plain: "You CANNOT be evicted without a court order — regardless of the reason. Self-help evictions (changing locks, removing belongings) are illegal." },
    }
  },

  // ═══ CRIMINAL ═══
  "CrimProc": {
    fullName: "Criminal Procedure Act 51 of 1977",
    shortName: "Criminal Procedure Act",
    year: 1977,
    category: "criminal",
    keywords: ["arrested", "arrest", "bail", "police", "charge", "criminal", "court", "trial", "rights", "detained", "prison", "jail", "sentence", "magistrate", "crime", "offence", "suspect", "warrant"],
    sections: {
      "35": { title: "Rights of arrested persons (Constitution s35)", text: "Everyone who is arrested for allegedly committing an offence has the right to remain silent; to be informed promptly of the right to remain silent; not to be compelled to make any confession; to be brought before a court as soon as reasonably possible.", plain: "If arrested, you have the RIGHT TO REMAIN SILENT, the right to a lawyer, the right to be told why you're arrested, and the right to appear in court within 48 hours." },
      "60": { title: "Bail", text: "An accused who is in custody in respect of an offence shall be entitled to be released on bail at any stage preceding his or her conviction, unless the court finds that it is in the interests of justice that the accused be detained in custody.", plain: "You have the right to apply for bail. The court will consider: flight risk, danger to public, likelihood of interfering with witnesses, and the seriousness of the offence." },
    }
  },

  // ═══ FAMILY ═══
  "DVA": {
    fullName: "Domestic Violence Act 116 of 1998",
    shortName: "DVA",
    year: 1998,
    category: "criminal",
    keywords: ["domestic violence", "abuse", "protection order", "restraining order", "spouse", "partner", "assault", "intimidation", "harassment", "stalking", "abusive", "beating", "hit", "threatened"],
    sections: {
      "4": { title: "Application for protection order", text: "Any complainant may in the prescribed manner apply to the court for a protection order.", plain: "You can apply for a FREE protection order at any magistrate's court. You don't need a lawyer. The court can grant an interim order on the same day." },
      "7": { title: "Court's powers", text: "The court may prohibit the respondent from committing any act of domestic violence; entering the shared residence; or approaching the complainant.", plain: "A protection order can: stop your abuser from coming near you, kick them out of the shared home, give you temporary custody of children, and order police to seize weapons." },
    }
  },
  "Maintenance": {
    fullName: "Maintenance Act 99 of 1998",
    shortName: "Maintenance Act",
    year: 1998,
    category: "civil",
    keywords: ["maintenance", "child support", "alimony", "child maintenance", "father", "mother", "custody", "maintenance court", "garnishee", "support"],
    sections: {
      "15": { title: "Duty to support", text: "Every person is liable to maintain his or her child who is unable to support himself or herself.", plain: "BOTH parents have a legal duty to support their children financially, based on their means. This applies whether married or not." },
      "16": { title: "Maintenance court", text: "A maintenance court may make a maintenance order against any person legally liable to maintain any other person.", plain: "If a parent isn't paying child support, you can open a case at the Maintenance Court for FREE. The court can order salary deductions (garnishee) to ensure payment." },
    }
  },

  // ═══ DATA / PRIVACY ═══
  "POPIA": {
    fullName: "Protection of Personal Information Act 4 of 2013",
    shortName: "POPIA",
    year: 2013,
    category: "civil",
    keywords: ["privacy", "personal information", "data", "popia", "information", "consent", "data breach", "spam", "unsolicited", "marketing", "personal data", "information officer"],
    sections: {
      "11": { title: "Consent for processing", text: "Personal information may only be processed if the data subject consents to the processing.", plain: "Companies need your CONSENT before collecting or using your personal information. You can withdraw consent at any time." },
      "14": { title: "Objection to processing", text: "A data subject may object to the processing of personal information at any time.", plain: "You have the right to tell any company to STOP processing your personal information. They must comply unless they have a legal obligation to continue." },
      "18": { title: "Notification", text: "When personal information is collected, the responsible party must take reasonably practicable steps to ensure that the data subject is aware of the information being collected.", plain: "Companies MUST tell you what information they're collecting, why, and how they'll use it — before or at the time of collection." },
      "22": { title: "Security measures", text: "A responsible party must secure the integrity and confidentiality of personal information in its possession or under its control.", plain: "Companies must protect your data with reasonable security. If there's a data breach, they must notify you AND the Information Regulator." },
    }
  },

  // ═══ CONSTITUTION ═══
  "Constitution": {
    fullName: "Constitution of the Republic of South Africa, 1996",
    shortName: "Constitution",
    year: 1996,
    category: "general",
    keywords: ["rights", "constitution", "bill of rights", "equality", "dignity", "freedom", "expression", "assembly", "property", "housing", "healthcare", "education", "access to justice", "fair trial"],
    sections: {
      "9": { title: "Equality", text: "Everyone is equal before the law and has the right to equal protection and benefit of the law. The state may not unfairly discriminate directly or indirectly against anyone on one or more grounds, including race, gender, sex, pregnancy, marital status, ethnic or social origin, colour, sexual orientation, age, disability, religion, conscience, belief, culture, language and birth.", plain: "Nobody — not the government, not your employer, not a business — may discriminate against you based on race, gender, age, disability, religion, sexual orientation, or other listed grounds." },
      "10": { title: "Human dignity", text: "Everyone has inherent dignity and the right to have their dignity respected and protected.", plain: "Your dignity is a fundamental right. This applies in every context — work, school, public spaces, and interactions with government." },
      "25": { title: "Property", text: "No one may be deprived of property except in terms of law of general application, and no law may permit arbitrary deprivation of property.", plain: "Your property cannot be taken from you without a law allowing it and without fair compensation (in the case of expropriation)." },
      "26": { title: "Housing", text: "Everyone has the right to have access to adequate housing. No one may be evicted from their home, or have their home demolished, without an order of court.", plain: "You have the right to adequate housing. Evictions require a court order — no one can simply throw you out." },
      "35": { title: "Arrested, detained and accused persons", text: "Everyone who is arrested for allegedly committing an offence has the right to remain silent, to be informed promptly of the right to remain silent, and not to be compelled to make any confession or admission.", plain: "If arrested: (1) Stay silent, (2) Ask for a lawyer, (3) Must appear in court within 48 hours, (4) Cannot be tortured or abused." },
    }
  },

  // ═══ TRAFFIC ═══
  "NRTA": {
    fullName: "National Road Traffic Act 93 of 1996",
    shortName: "NRTA",
    year: 1996,
    category: "criminal",
    keywords: ["traffic", "driving", "licence", "license", "drunk driving", "dui", "speeding", "accident", "road", "fine", "traffic fine", "breathalyser", "blood alcohol"],
    sections: {
      "65": { title: "Driving under the influence", text: "No person shall on a public road drive a vehicle while under the influence of intoxicating liquor or a drug having a narcotic effect, or with a blood alcohol level exceeding 0.05g/100ml.", plain: "The legal blood alcohol limit is 0.05g/100ml (about 1-2 drinks). For professional drivers, it's 0.02g/100ml. Penalties include fines up to R120,000 and/or 6 years imprisonment." },
      "63": { title: "Reckless or negligent driving", text: "No person shall on a public road drive a vehicle recklessly or negligently.", plain: "Reckless driving (intentionally dangerous) can lead to criminal charges, heavy fines, and imprisonment. Negligent driving (careless) can also result in prosecution." },
    }
  },
}

// Keyword matching engine
export function matchLegislation(query) {
  const q = query.toLowerCase()
  const matches = []

  for (const [actKey, act] of Object.entries(SA_LEGISLATION)) {
    let score = 0
    for (const kw of act.keywords) {
      if (q.includes(kw)) score += (kw.split(' ').length > 1 ? 3 : 1) // multi-word keywords score higher
    }
    if (score > 0) {
      // Find most relevant sections
      const relevantSections = []
      for (const [secNum, sec] of Object.entries(act.sections)) {
        const secText = `${sec.title} ${sec.text} ${sec.plain}`.toLowerCase()
        let secScore = 0
        for (const word of q.split(/\s+/)) {
          if (word.length > 3 && secText.includes(word)) secScore++
        }
        if (secScore > 0) relevantSections.push({ ...sec, number: secNum, score: secScore })
      }
      relevantSections.sort((a, b) => b.score - a.score)
      
      matches.push({
        act: act.fullName,
        shortName: act.shortName,
        year: act.year,
        category: act.category,
        score,
        sections: relevantSections.length > 0 ? relevantSections.slice(0, 3) : Object.entries(act.sections).slice(0, 2).map(([num, sec]) => ({ ...sec, number: num, score: 0 }))
      })
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return matches.slice(0, 3)
}

// Determine which plan to recommend based on category
export function recommendPlan(categories) {
  const hasCivil = categories.includes('civil')
  const hasLabour = categories.includes('labour')
  const hasCriminal = categories.includes('criminal')

  if ((hasCivil && hasLabour) || hasCriminal) {
    return { plan: 'Extensive Plan', price: 'R139', reason: 'Covers civil, labour AND criminal matters' }
  }
  if (hasLabour) {
    return { plan: 'Labour Legal Plan', price: 'R99', reason: 'Covers all employment and CCMA matters' }
  }
  return { plan: 'Civil Legal Plan', price: 'R99', reason: 'Covers contract, consumer, and property matters' }
}
