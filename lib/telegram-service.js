

/**
 * Infinity Legal - Telegram Bot Notification Service
 * Free notifications via Telegram Bot API
 * Setup: Message @BotFather on Telegram to create a bot and get a token
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getChatId() {
  return process.env.TELEGRAM_CHAT_ID;
}

/**
 * Send a text message via Telegram
 */
export async function sendTelegramMessage(text, options = {}) {
  const token = getBotToken();
  const chatId = options.chatId || getChatId();

  if (!token) {
    console.warn("Telegram bot token not configured. Message not sent.");
    return { success: false, error: "TELEGRAM_BOT_TOKEN not set", mock: true };
  }

  if (!chatId) {
    console.warn("Telegram chat ID not configured. Message not sent.");
    return { success: false, error: "TELEGRAM_CHAT_ID not set", mock: true };
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || "Telegram API error");
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err) {
    console.error("Telegram send error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send case creation notification
 */
export async function notifyNewCase(caseData, analysis) {
  const text = `
<b>🆕 New Legal Case Submitted</b>

<b>Category:</b> ${caseData.category || "General"}
<b>Urgency:</b> ${caseData.urgency || "Medium"}
<b>Status:</b> Open

<b>AI Analysis:</b>
${analysis.summary || analysis.category || "N/A"}

<b>Cost Estimate:</b> ${analysis.costEstimate?.range || "TBD"}

<i>Submitted at ${new Date().toLocaleString("en-ZA")}</i>
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Send attorney verification notification
 */
export async function notifyAttorneyVerified(attorneyName, email) {
  const text = `
<b>✅ Attorney Verified</b>

Attorney: ${attorneyName}
Email: ${email}

<i>Verified at ${new Date().toLocaleString("en-ZA")}</i>
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Send urgent case alert
 */
export async function notifyUrgentCase(caseData) {
  const text = `
<b>🚨 URGENT CASE ALERT</b>

<b>Category:</b> ${caseData.category}
<b>Urgency:</b> ${caseData.urgency}
<b>Client:</b> ${caseData.clientName || "Unknown"}

<i>Requires immediate attention. Assigned at ${new Date().toLocaleString("en-ZA")}</i>
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Send daily/weekly platform stats
 */
export async function notifyPlatformStats(stats) {
  const text = `
<b>📊 Infinity Legal Platform Stats</b>

Total Attorneys: ${stats.totalAttorneys || 0}
Verified Attorneys: ${stats.verifiedAttorneys || 0}
Pending Attorneys: ${stats.pendingAttorneys || 0}

Total Cases: ${stats.totalCases || 0}
Open Cases: ${stats.openCases || 0}
Critical Cases: ${stats.criticalCases || 0}

<i>Report generated at ${new Date().toLocaleString("en-ZA")}</i>
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Check bot status and get updates
 */
export async function getTelegramBotInfo() {
  const token = getBotToken();
  if (!token) return { configured: false };

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/getMe`);
    const data = await response.json();
    return {
      configured: true,
      botName: data.result?.username,
      botId: data.result?.id,
      canReadMessages: data.result?.can_read_all_group_messages,
    };
  } catch (err) {
    return { configured: true, error: err.message };
  }
}
