/**
 * Environment Variable Validation
 * Ensures all required env vars are configured — no fallback defaults in production.
 * Run at startup to fail fast on misconfiguration.
 */

const REQUIRED_VARS = [
  { key: 'MONGO_URL', description: 'MongoDB connection string' },
  { key: 'DB_NAME', description: 'MongoDB database name' },
  { key: 'NEXT_PUBLIC_BASE_URL', description: 'Public base URL for the application' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
]

const OPTIONAL_VARS = [
  { key: 'KIMI_API_KEY', description: 'Kimi AI / Moonshot API key' },
  { key: 'PAYFAST_MERCHANT_ID', description: 'PayFast merchant ID' },
  { key: 'PAYFAST_MERCHANT_KEY', description: 'PayFast merchant key' },
  { key: 'BREVO_API_KEY', description: 'Brevo (Sendinblue) API key for emails' },
  { key: 'LLM_KEY', description: 'Emergent LLM proxy key' },
]

export function validateEnvironment() {
  const errors = []
  const warnings = []

  // Check required variables
  for (const { key, description } of REQUIRED_VARS) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      errors.push(`❌ Missing required env var: ${key} (${description})`)
    } else if (value.startsWith('your_') || value === 'changeme' || value === 'placeholder') {
      errors.push(`❌ Placeholder value detected for: ${key} (${description})`)
    }
  }

  // Check optional variables
  for (const { key, description } of OPTIONAL_VARS) {
    const value = process.env[key]
    if (!value || value.trim() === '' || value.startsWith('your_')) {
      warnings.push(`⚠️  Optional env var not configured: ${key} (${description})`)
    }
  }

  // Security checks
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('❌ NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production')
  }
  if (process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_BASE_URL.startsWith('https://')) {
    warnings.push('⚠️  NEXT_PUBLIC_BASE_URL should use HTTPS in production')
  }

  return { errors, warnings, isValid: errors.length === 0 }
}

export function logEnvironmentStatus() {
  const { errors, warnings, isValid } = validateEnvironment()

  console.log('\n=== ENVIRONMENT VALIDATION ===')
  
  if (isValid) {
    console.log('✅ All required environment variables are configured')
  } else {
    console.error('🚨 ENVIRONMENT CONFIGURATION ERRORS:')
    errors.forEach(e => console.error(`   ${e}`))
  }

  if (warnings.length > 0) {
    console.warn('⚠️  WARNINGS:')
    warnings.forEach(w => console.warn(`   ${w}`))
  }

  console.log('================================\n')
  return isValid
}
