"use server";

/**
 * Infinity Legal - Keep-Alive Service
 * Prevents Supabase free tier from pausing after 7 days inactivity
 * Run via Vercel Cron every 3 days
 */

import { supabaseAdmin } from "./auth-db-service";

export async function keepAlive() {
  try {
    const { data, error } = await supabaseAdmin
      .from("health_check")
      .upsert({ id: 1, last_ping: new Date().toISOString() })
      .select();

    if (error) throw error;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: "Supabase project kept alive"
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
