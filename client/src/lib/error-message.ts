const TECHNICAL_ERROR_PATTERNS = [
  /<!doctype html/i,
  /<html[\s>]/i,
  /<pre>/i,
  /failed query/i,
  /\bselect\b.+\bfrom\b/i,
  /\binsert\s+into\b/i,
  /\bupdate\b.+\bset\b/i,
  /\bdelete\s+from\b/i,
  /\b(node|sql|postgres|postgresql|drizzle)\b/i,
  /native websocket/i,
  /\bat\s+\S+\s+\(/i,
];

function rawMessage(error: unknown) {
  if (error instanceof Error) return error.message.trim();
  if (typeof error === "string") return error.trim();
  return "";
}

export function getUserFriendlyError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  const message = rawMessage(error)
    .replace(/^HTTP\s+\d+\s+[^:]+:\s*/i, "")
    .trim();

  if (!message || TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  return message;
}