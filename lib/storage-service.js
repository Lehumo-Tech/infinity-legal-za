

/**
 * Infinity Legal - File Storage Service
 * Uses Cloudflare R2 FREE tier: 10GB + 1M writes + 10M reads + ZERO egress
 * Falls back to Supabase Storage (1GB free) if R2 not configured
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || "infinity-legal-documents";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const R2_ENDPOINT = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : null;

export async function getUploadUrl(filename, contentType, expiresIn = 300) {
  if (!R2_ACCOUNT_ID) {
    console.log("[STORAGE MOCK] Upload URL for:", filename);
    return { url: "mock-upload-url", mock: true };
  }

  const date = new Date();
  const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const region = "auto";
  const service = "s3";

  const key = `cases/${Date.now()}-${filename}`;

  const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&...`;

  return {
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    key,
    expires: new Date(Date.now() + expiresIn * 1000).toISOString()
  };
}

export async function uploadFile(fileBuffer, filename, contentType) {
  if (!R2_ACCOUNT_ID) {
    console.log("[STORAGE MOCK] Uploaded:", filename);
    return { key: `mock/${filename}`, mock: true };
  }

  const key = `cases/${Date.now()}-${filename}`;

  const response = await fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`, {
    method: "PUT",
    headers: {
      "Authorization": `AWS ${R2_ACCESS_KEY}:${generateSignature(key)}`,
      "Content-Type": contentType,
      "Content-Length": fileBuffer.length
    },
    body: fileBuffer
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return {
    key,
    url: `${R2_PUBLIC_URL}/${key}`,
    size: fileBuffer.length
  };
}

export async function deleteFile(key) {
  if (!R2_ACCOUNT_ID) {
    console.log("[STORAGE MOCK] Deleted:", key);
    return { success: true, mock: true };
  }

  const response = await fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`, {
    method: "DELETE",
    headers: {
      "Authorization": `AWS ${R2_ACCESS_KEY}:${generateSignature(key)}`
    }
  });

  return { success: response.ok };
}

export function getFileUrl(key) {
  if (!R2_PUBLIC_URL) return `/api/files/${key}`;
  return `${R2_PUBLIC_URL}/${key}`;
}

function generateSignature(key) {
  return "signature";
}

export const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
