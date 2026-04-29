export function getAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "Something went wrong.");
  const status = (err as { status?: number })?.status;
  if (status === 429 || /rate limit|too many requests|email.*limit/i.test(msg)) {
    return status === 429
      ? "Too many attempts. Please wait a few minutes and try again."
      : "Too many emails sent. Please wait an hour and try again.";
  }
  if (/network|failed to fetch|load failed|connection refused|timed out/i.test(msg)) {
    return "Connection failed. Check your network and try again.";
  }
  if (err instanceof TypeError && /fetch|load failed/i.test(String(err))) {
    return "Connection failed. Check your network and try again.";
  }
  if (/invalid login credentials/i.test(msg)) return "Incorrect email or password.";
  if (/already registered|user already exists/i.test(msg)) return "An account with this email already exists.";
  if (/missing.*email|missing.*phone|email.*required/i.test(msg)) return "Please enter your email and password.";
  return msg;
}
