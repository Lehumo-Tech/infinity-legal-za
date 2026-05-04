

/**
 * Infinity Legal - Hugging Face Inference Service
 * Free text summarization and analysis for legal documents
 * No credit card required. Uses public models.
 * 
 * Setup: 
 * 1. Create account at https://huggingface.co (free)
 * 2. Get token: https://huggingface.co/settings/tokens
 * 3. Add HUGGINGFACE_API_KEY=hf_xxx to .env.local
 */

const HF_API_URL = "https://api-inference.huggingface.co/models";

// Models optimized for legal/summarization tasks
// All models below are freely accessible
const MODELS = {
  summarization: "facebook/bart-large-cnn",      // Fast, good for summaries
  legal: "nlpaueb/legal-bert-base-uncased",    // Legal text understanding
  sentiment: "cardiffnlp/twitter-roberta-base-sentiment-latest", // Client mood analysis
  qa: "deepset/roberta-base-squad2",       // Question answering
  textGen: "mistralai/Mistral-7B-Instruct-v0.2", // Chat/completion (free tier)
  fallback: "gpt2"                             // Ultimate fallback
};

async function callHuggingFace(model, inputs, options = {}) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs, parameters: options }),
  });
    
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }
    
  return await response.json();
}

/**
 * Summarize a legal document or text
 */
export async function summarizeText(text, maxLength = 150, minLength = 30) {
  if (!text || text.length < 50) {
    return { summary: text, originalLength: text?.length || 0, model: "none" };
  }

  try {
    const result = await callHuggingFace(
      MODELS.summarization,
      text,
      { max_length: maxLength, min_length: minLength, do_sample: false }
    );

    // Handle different response formats
    let summary = "";
    if (Array.isArray(result) && result[0]?.summary_text) {
      summary = result[0].summary_text;
    } else if (result.summary_text) {
      summary = result.summary_text;
    } else {
      summary = text.substring(0, 200) + "...";
    }

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      model: MODELS.summarization,
      source: "huggingface",
    };
  } catch (err) {
    console.warn("Hugging Face summarization failed:", err.message);
    // Fallback: simple extraction
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const fallbackSummary = sentences.slice(0, 3).join(" ").trim();
    return {
      summary: fallbackSummary,
      originalLength: text.length,
      summaryLength: fallbackSummary.length,
      model: "fallback-extraction",
      source: "fallback",
      error: err.message,
    };
  }
}

/**
 * Analyze sentiment of client messages or case descriptions
 */
export async function analyzeSentiment(text) {
  if (!text) return { sentiment: "neutral", confidence: 0 };

  try {
    const result = await callHuggingFace(MODELS.sentiment, text);

    if (Array.isArray(result) && result[0]) {
      const scores = result[0];
      const top = scores.reduce((a, b) => (a.score > b.score ? a : b));
      return {
        sentiment: top.label,
        confidence: top.score,
        scores,
        model: MODELS.sentiment,
      };
    }

    return { sentiment: "neutral", confidence: 0.5, model: MODELS.sentiment };
  } catch (err) {
    console.warn("Sentiment analysis failed:", err.message);
    return { sentiment: "neutral", confidence: 0, error: err.message };
  }
}

/**
 * Extract named entities (people, organizations, locations) from text
 */
export async function extractEntities(text) {
  if (!text) return { entities: [] };

  try {
    const result = await callHuggingFace(MODELS.ner, text);

    if (Array.isArray(result)) {
      const entities = result.map(r => ({
        word: r.word,
        type: r.entity_group,
        score: r.score,
      }));
      return { entities, model: MODELS.ner };
    }

    return { entities: [], model: MODELS.ner };
  } catch (err) {
    console.warn("NER extraction failed:", err.message);
    return { entities: [], error: err.message };
  }
}

/**
 * Summarize a legal case from intake answers
 */
export async function summarizeCase(answers) {
  const combined = answers.filter(Boolean).join("\n\n");
  return summarizeText(combined, 200, 50);
}
