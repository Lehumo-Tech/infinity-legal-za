"use server";

/**
 * Infinity Legal - Auth & Database Service
 * Bridge module for Supabase auth and database operations
 */

import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

export { supabase, supabaseAdmin };

// ===================== AUTH FUNCTIONS =====================

export async function signUpClient(email, password, data = {}) {
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "client",
        full_name: data.full_name || "",
        phone: data.phone || "",
      },
    },
  });

  if (error) throw error;

  // Create profile
  if (authData.user) {
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      email,
      role: "client",
      full_name: data.full_name || "",
      phone: data.phone || "",
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn("Profile creation error (may already exist):", profileError.message);
    }
  }

  return authData;
}

export async function signUpAttorney(email, password, data = {}) {
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "attorney",
        full_name: data.full_name || "",
        phone: data.phone || "",
      },
    },
  });

  if (error) throw error;

  if (authData.user) {
    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      email,
      role: "attorney",
      full_name: data.full_name || "",
      phone: data.phone || "",
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn("Profile creation error (may already exist):", profileError.message);
    }

    // Create attorney record
    const { error: attorneyError } = await supabaseAdmin.from("attorneys").insert({
      id: authData.user.id,
      lpc_number: data.lpc_number || "",
      status: "unverified",
      specializations: data.specializations || [],
      years_experience: data.years_experience || 0,
      location: data.location || "",
      bio: data.bio || "",
      trust_account_bank: data.trust_account_bank || "",
      trust_account_number: data.trust_account_number || "",
      trust_account_branch: data.trust_account_branch || "",
      created_at: new Date().toISOString(),
    });

    if (attorneyError) {
      console.warn("Attorney record creation error:", attorneyError.message);
    }
  }

  return authData;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// ===================== CASE FUNCTIONS =====================

export async function createCase(userId, answers, analysis) {
  const caseData = {
    client_id: userId,
    category: analysis.category || "Other",
    subcategory: analysis.subcategory || "",
    urgency: analysis.urgency || "medium",
    status: "open",
    intake_data: answers,
    ai_analysis: analysis,
    cost_estimate: analysis.costEstimate || null,
    next_steps: analysis.nextSteps || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("cases")
    .insert(caseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClientCases(userId) {
  const { data, error } = await supabase
    .from("cases")
    .select("*, attorney:attorneys(id, full_name, specializations)")
    .eq("client_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAttorneyCases(attorneyId) {
  const { data, error } = await supabase
    .from("cases")
    .select("*, client:profiles(id, full_name, email, phone)")
    .eq("attorney_id", attorneyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function assignCase(caseId, attorneyId) {
  const { data, error } = await supabaseAdmin
    .from("cases")
    .update({
      attorney_id: attorneyId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", caseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===================== ATTORNEY FUNCTIONS =====================

export async function getAllAttorneys() {
  const { data, error } = await supabase
    .from("attorneys")
    .select("*, profiles(id, email, full_name, phone, created_at)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAttorneysBySpecialization(specialization) {
  const { data, error } = await supabase
    .from("attorneys")
    .select("*, profiles(id, email, full_name, phone)")
    .contains("specializations", [specialization])
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function verifyAttorney(attorneyId) {
  const { data, error } = await supabaseAdmin
    .from("attorneys")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
    })
    .eq("id", attorneyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===================== CONSENT FUNCTIONS =====================

export async function logConsent(userId, consentType, metadata = {}) {
  const { error } = await supabaseAdmin.from("consent_logs").insert({
    user_id: userId,
    consent_type: consentType,
    metadata,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
  return true;
}
