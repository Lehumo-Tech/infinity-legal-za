

/**
 * Infinity Legal - Real-time Messaging Service
 * Uses Supabase Realtime FREE tier: 200 concurrent connections
 * Built into Supabase - no extra cost beyond database
 */

import { supabase } from "./auth-db-service";

export function subscribeToCaseUpdates(userId, callback) {
  const channel = supabase
    .channel(`cases:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cases",
        filter: `client_id=eq.${userId}`
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToAttorneyCases(attorneyId, callback) {
  const channel = supabase
    .channel(`attorney-cases:${attorneyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cases",
        filter: `attorney_id=eq.${attorneyId}`
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToCaseMessages(caseId, callback) {
  const channel = supabase
    .channel(`messages:${caseId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `case_id=eq.${caseId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function sendMessage(caseId, senderId, content, attachments = []) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      case_id: caseId,
      sender_id: senderId,
      content,
      attachments,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCaseMessages(caseId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles(full_name, role)")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export function broadcastNotification(userId, notification) {
  const channel = supabase.channel(`notifications:${userId}`);
  channel.send({
    type: "broadcast",
    event: "notification",
    payload: notification
  });
}
