type ValidationItem = { loc?: unknown; msg?: string };

export function extractErrorMessage(err: unknown, fallback = "Request failed"): string {
  const detail =
    typeof err === "object" && err && "response" in err
      ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
      : undefined;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = (detail as ValidationItem[])
      .map((e) => {
        const field = Array.isArray(e?.loc) ? (e.loc as unknown[]).slice(1).join(".") : "";
        return field ? `${field}: ${e?.msg ?? ""}` : e?.msg ?? "";
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }

  if (detail && typeof detail === "object") {
    const msg = (detail as { msg?: unknown }).msg;
    if (typeof msg === "string") return msg;
  }

  return fallback;
}
