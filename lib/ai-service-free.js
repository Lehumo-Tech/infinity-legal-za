

/**
 * Infinity Legal - Free AI Provider Service
 * Replaces paid OpenAI with free APIs: Groq (primary) + Gemini (fallback)
 * Zero credit card required. Zero cost.
 */

// ===================== CONFIGURATION =====================
const AI_PROVIDERS = {
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    models: {
      fast: "llama-3.1-8b-instant",
      quality: "llama-3.3-70b-versatile",
      balanced: "meta-llama/llama-4-scout-17b-16e-instruct"
    },
    defaultModel: "llama-3.3-70b-versatile",
    headers: (apiKey) => ({
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    })
  },
  gemini: {
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: {
      flash: "gemini-2.5-flash",
      flashLite: "gemini-2.5-flash-lite"
    },
    defaultModel: "gemini-2.5-flash-lite",
    headers: (apiKey) => ({
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    })
  }
};

// ===================== PII REDACTION (Preserved) =====================
function redactPII(text) {
  if (!text || typeof text !== "string") return text;

  let redacted = text.replace(/\b\d{13}\b/g, "[REDACTED-ID]");
  redacted = redacted.replace(/\b0[6-8][0-9]{8}\b/g, "[REDACTED-PHONE]");
  redacted = redacted.replace(/\b\+27[6-8][0-9]{8}\b/g, "[REDACTED-PHONE]");
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[REDACTED-EMAIL]");
  redacted = redacted.replace(/\b\d{8,16}\b/g, "[REDACTED-ACCOUNT]");

  return redacted;
}

// ===================== EMERGENCY DETECTION (Preserved) =====================
const EMERGENCY_KEYWORDS = [
  "arrested", "arrest", "custody", "police station", "detained",
  "eviction", "evicted", "lockout", "locked out", "homeless",
  "urgent", "emergency", "immediate", "today", "now",
  "bail", "warrant", "subpoena", "summons",
  "domestic violence", "abuse", "assault", "threatened",
  "child removed", "social services", "cyf"
];

function detectEmergency(text) {
  const lowerText = text.toLowerCase();
  const found = EMERGENCY_KEYWORDS.filter(kw => lowerText.includes(kw));
  return {
    isEmergency: found.length > 0,
    keywords: found,
    severity: found.length >= 3 ? "critical" : found.length >= 1 ? "high" : "normal"
  };
}

// ===================== SYSTEM PROMPT (Optimized for Free Models) =====================
function buildSystemPrompt() {
  return `You are Infinity Legal's AI Legal Intake Assistant. You analyze South African legal problems and provide structured assessments.

## Rules:
- NEVER provide specific legal advice. Only general information and next steps.
- Always recommend consulting a qualified South African attorney.
- Include a disclaimer that this is not legal advice.
- Be empathetic but professional.

## Output Format (JSON only):
{
  "category": "Criminal|Family|Labour|Property|Commercial|Personal_Injury|Immigration|Wills_Estates|Constitutional|Consumer|Other",
  "subcategory": "Specific type within category",
  "urgency": "low|medium|high|critical",
  "costEstimate": {
    "range": "R X - R Y",
    "basis": "hourly|fixed|contingency|pro-bono",
    "notes": "Factors affecting cost"
  },
  "nextSteps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "relevantLaws": [
    "Act Name, Section X"
  ],
  "suggestedAttorneyType": "Type of attorney needed",
  "confidence": 0.0-1.0,
  "disclaimer": "This is general information only...",
  "emergencyResources": ["if applicable"]
}`;
}

// ===================== AI PROVIDER CALLER =====================
async function callProvider(providerKey, apiKey, messages, model = null) {
  const provider = AI_PROVIDERS[providerKey];
  const selectedModel = model || provider.defaultModel;

  const response = await fetch(provider.baseUrl, {
    method: "POST",
    headers: provider.headers(apiKey),
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const rateLimitRemaining = response.headers.get("x-ratelimit-remaining-requests");
  if (rateLimitRemaining && parseInt(rateLimitRemaining) < 50) {
    console.warn(`[${provider.name}] Rate limit running low: ${rateLimitRemaining} requests remaining`);
  }

  return {
    content: data.choices[0].message.content,
    provider: providerKey,
    model: selectedModel,
    usage: data.usage || null
  };
}

// ===================== MAIN ANALYSIS FUNCTION =====================
export async function analyzeLegalIntake(answers, plainLanguage = false) {
  const startTime = Date.now();

  const redactedAnswers = answers.map(a => redactPII(a));
  const fullText = redactedAnswers.join(" ");
  const emergency = detectEmergency(fullText);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Analyze this South African legal matter:

Q1: ${redactedAnswers[0]}
Q2: ${redactedAnswers[1]}
Q3: ${redactedAnswers[2]}

${plainLanguage ? "Explain in simple, plain language." : ""}
${emergency.isEmergency ? "This appears to be an urgent matter. Prioritize emergency resources." : ""}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let result = null;
  let errors = [];

  if (groqKey) {
    try {
      result = await callProvider("groq", groqKey, messages, AI_PROVIDERS.groq.models.quality);
      console.log("Groq analysis successful");
    } catch (err) {
      console.warn("Groq failed:", err.message);
      errors.push({ provider: "groq", error: err.message });

      try {
        result = await callProvider("groq", groqKey, messages, AI_PROVIDERS.groq.models.fast);
        console.log("Groq fast model fallback successful");
      } catch (err2) {
        errors.push({ provider: "groq-fast", error: err2.message });
      }
    }
  }

  if (!result && geminiKey) {
    try {
      result = await callProvider("gemini", geminiKey, messages, AI_PROVIDERS.gemini.models.flashLite);
      console.log("Gemini fallback successful");
    } catch (err) {
      console.warn("Gemini failed:", err.message);
      errors.push({ provider: "gemini", error: err.message });
    }
  }

  let analysis;
  try {
    analysis = JSON.parse(result.content);
    analysis.category = analysis.category || "Other";
    analysis.confidence = analysis.confidence || 0.5;
    analysis.urgency = emergency.isEmergency ? "critical" : (analysis.urgency || "medium");
    analysis.emergencyDetected = emergency.isEmergency;
    analysis.emergencyKeywords = emergency.keywords;
  } catch (parseErr) {
    console.error("JSON parse error:", parseErr);
    analysis = {
      category: "Other",
      subcategory: "General Legal Matter",
      urgency: emergency.isEmergency ? "critical" : "medium",
      costEstimate: { range: "R500 - R2,000", basis: "consultation", notes: "Initial consultation fee varies by attorney" },
      nextSteps: [
        "Contact a qualified South African attorney for proper advice",
        "Gather all relevant documents and evidence",
        "Document all interactions and keep records"
      ],
      relevantLaws: ["Consult an attorney for applicable legislation"],
      suggestedAttorneyType: "General Practice Attorney",
      confidence: 0.3,
      disclaimer: "This is general information only and not legal advice. Consult a qualified attorney.",
      emergencyResources: emergency.isEmergency ? ["Legal Aid South Africa: 0800 110 110", "SAPS Emergency: 10111"] : [],
      emergencyDetected: emergency.isEmergency,
      emergencyKeywords: emergency.keywords,
      _parseError: true
    };
  }

  analysis._meta = {
    provider: result?.provider || "none",
    model: result?.model || "none",
    processingTime: Date.now() - startTime,
    redacted: true,
    timestamp: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined
  };

  return analysis;
}

// ===================== MOCK MODE =====================
export async function analyzeLegalIntakeMock(answers, plainLanguage = false) {
  const redactedAnswers = answers.map(a => redactPII(a));
  const fullText = redactedAnswers.join(" ").toLowerCase();
  const emergency = detectEmergency(fullText);

  const categories = {
    criminal: ["arrest", "crime", "theft", "fraud", "assault", "drug", "murder", "bail"],
    family: ["divorce", "custody", "child", "maintenance", "marriage", "domestic"],
    labour: ["work", "job", "employer", "dismissal", "ccma", "unfair", "salary"],
    property: ["house", "rent", "landlord", "lease", "property", "eviction", "bond"],
    commercial: ["business", "contract", "company", "debt", "loan", "agreement"],
    personal_injury: ["accident", "injury", "hospital", "damages", "raf"],
    immigration: ["visa", "permit", "home affairs", "deport", "asylum"],
    wills_estates: ["will", "estate", "deceased", "inherit", "executor"],
    consumer: ["consumer", "defective", "refund", "cpa", "product"]
  };

  let detectedCategory = "Other";
  let maxScore = 0;

  for (const [cat, keywords] of Object.entries(categories)) {
    const score = keywords.filter(k => fullText.includes(k)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat;
    }
  }

  const categoryLabels = {
    criminal: "Criminal Law",
    family: "Family Law",
    labour: "Labour Law",
    property: "Property Law",
    commercial: "Commercial Law",
    personal_injury: "Personal Injury / RAF",
    immigration: "Immigration Law",
    wills_estates: "Wills & Estates",
    consumer: "Consumer Protection",
    other: "General Legal Matter"
  };

  return {
    category: categoryLabels[detectedCategory] || "General Legal Matter",
    subcategory: "To be determined by attorney consultation",
    urgency: emergency.isEmergency ? "critical" : "medium",
    costEstimate: {
      range: "R500 - R3,000",
      basis: "consultation",
      notes: "Costs vary significantly based on complexity and attorney experience"
    },
    nextSteps: [
      "Schedule a consultation with a qualified attorney",
      "Prepare all relevant documents and correspondence",
      "Write down a timeline of events while memory is fresh"
    ],
    relevantLaws: ["Applicable legislation to be confirmed by attorney"],
    suggestedAttorneyType: `${categoryLabels[detectedCategory]} Attorney`,
    confidence: maxScore > 0 ? 0.6 : 0.3,
    disclaimer: "This is general information only and does not constitute legal advice. Always consult a qualified South African attorney for your specific situation.",
    emergencyResources: emergency.isEmergency ? [
      "Legal Aid South Africa: 0800 110 110",
      "SAPS Emergency: 10111",
      "Gender-Based Violence Helpline: 0800 428 428"
    ] : [],
    emergencyDetected: emergency.isEmergency,
    emergencyKeywords: emergency.keywords,
    _meta: {
      provider: "mock",
      model: "keyword-based",
      processingTime: 0,
      redacted: true,
      timestamp: new Date().toISOString(),
      mockMode: true
    }
  };
}

// ===================== SMART ROUTER =====================
export async function analyzeIntakeSmart(answers, plainLanguage = false) {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (hasGroq || hasGemini) {
    try {
      return await analyzeLegalIntake(answers, plainLanguage);
    } catch (err) {
      console.error("AI providers failed, falling back to mock:", err);
      return analyzeLegalIntakeMock(answers, plainLanguage);
    }
  }

  console.log("No free AI API keys found. Using mock mode.");
  return analyzeLegalIntakeMock(answers, plainLanguage);
}
