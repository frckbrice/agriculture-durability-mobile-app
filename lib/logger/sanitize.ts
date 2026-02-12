/**
 * Response and error sanitization.
 * Maps technical/backend messages to user-friendly ones so users never see
 * stack traces, API details, or tech stack information.
 */

/** User-facing fallback when we cannot determine a safe message */
const GENERIC_USER_MESSAGE =
  "Une erreur s'est produite. Veuillez réessayer ou contacter le support si le problème persiste.";

/** Patterns that indicate technical content (never show to user as-is) */
const TECHNICAL_PATTERNS = [
  /at\s+[\w.$]+\s*\(/i, // stack trace "at foo (file:line)"
  /\.tsx?\s*:\s*\d+/i, // file:line
  /\.jsx?\s*:\s*\d+/i,
  /node_modules/i,
  /axios/i,
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ENETUNREACH/i,
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:\d+)?/i, // IP:port
  /https?:\/\/[^\s]+/i, // URLs
  /Bearer\s+[\w.-]+/i, // tokens
  /\[object\s+Object\]/i,
  /undefined|null\s+is\s+not/i,
  /Cannot read propert(y|ies)/i,
  /Failed to fetch|Network request failed/i,
];

/** Known technical messages mapped to user-friendly (French) messages */
const USER_FRIENDLY_MAP: Record<string, string> = {
  // Network
  network: "Vérifiez votre connexion internet et réessayez.",
  timeout: "La requête a pris trop de temps. Réessayez.",
  "network request failed": "Impossible de contacter le serveur. Vérifiez votre connexion.",
  "failed to fetch": "Impossible de contacter le serveur. Vérifiez votre connexion.",
  econnrefused: "Le serveur est indisponible. Réessayez plus tard.",
  enotfound: "Service introuvable. Vérifiez votre connexion.",
  etimedout: "Délai dépassé. Réessayez.",
  enetunreach: "Réseau inaccessible. Vérifiez votre connexion.",
  // Auth
  "invalid credentials": "Identifiants incorrects.",
  "unauthorized": "Session expirée ou invalide. Veuillez vous reconnecter.",
  "token": "Session expirée. Veuillez vous reconnecter.",
  "401": "Session expirée. Veuillez vous reconnecter.",
  "403": "Vous n'avez pas les droits pour cette action.",
  "404": "Élément introuvable.",
  // Server
  "500": "Erreur serveur. Réessayez plus tard.",
  "502": "Service temporairement indisponible. Réessayez.",
  "503": "Service temporairement indisponible. Réessayez.",
  // Generic
  "invalid data": "Données invalides. Vérifiez les champs.",
  "validation": "Vérifiez les informations saisies.",
};

function normalizeForMatch(message: string): string {
  return message.toLowerCase().trim().replace(/\s+/g, " ");
}

function isTechnical(message: string): boolean {
  return TECHNICAL_PATTERNS.some((re) => re.test(message));
}

/**
 * Get a user-friendly message from an error or response.
 * Use this for UI (toasts, alerts). Never show raw error.message in production.
 */
export function sanitizeForUser(error: unknown): string {
  if (error == null) return GENERIC_USER_MESSAGE;

  let raw = "";
  if (typeof error === "string") raw = error;
  else if (error instanceof Error) raw = error.message;
  else if (typeof (error as { message?: string }).message === "string")
    raw = (error as { message: string }).message;
  else if (typeof (error as { error?: string }).error === "string")
    raw = (error as { error: string }).error;
  else if (typeof (error as { data?: { message?: string } }).data?.message === "string")
    raw = (error as { data: { message: string } }).data.message;
  else return GENERIC_USER_MESSAGE;

  const normalized = normalizeForMatch(raw);

  // Check known mappings first
  for (const [tech, friendly] of Object.entries(USER_FRIENDLY_MAP)) {
    if (normalized.includes(tech)) return friendly;
  }

  // If it looks technical, never expose it
  if (isTechnical(raw)) return GENERIC_USER_MESSAGE;

  // Short, non-technical message might be safe (e.g. "Champ requis")
  if (raw.length <= 120 && !/[\w.]+\.[a-z]+/.test(raw)) return raw;

  return GENERIC_USER_MESSAGE;
}

/**
 * Sanitize an API response payload for logging (dev only).
 * Removes tokens, full URLs, and PII so dev logs stay safe.
 */
export function sanitizeForLog(payload: unknown): unknown {
  if (payload == null) return payload;
  if (typeof payload !== "object") return payload;

  const obj = payload as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  const redactKeys = [
    "authorization",
    "token",
    "password",
    "secret",
    "apiKey",
    "api_key",
    "cookie",
    "set-cookie",
  ];

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (redactKeys.some((k) => keyLower.includes(k))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      sanitized[key] = "[URL]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value))
      sanitized[key] = sanitizeForLog(value);
    else sanitized[key] = value;
  }

  return sanitized;
}
