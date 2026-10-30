// CSP violation sink (report-only policy). Browsers POST here when a resource
// would have been blocked; we log one line per report so the pilot can decide
// what to tighten before switching the header to enforcing.

const MAX_BODY = 16 * 1024;

export async function POST(req: Request) {
  const body = await req.text().catch(() => "");
  if (body && body.length <= MAX_BODY) {
    try {
      const parsed: unknown = JSON.parse(body);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries.slice(0, 5)) {
        const report =
          (entry as { "csp-report"?: Record<string, string> })["csp-report"] ??
          (entry as { body?: Record<string, string> }).body;
        if (!report) continue;
        console.warn(
          "[csp]",
          report["violated-directive"] ?? report.effectiveDirective ?? "?",
          "→",
          report["blocked-uri"] ?? report.blockedURL ?? "?",
          "on",
          report["document-uri"] ?? report.documentURL ?? "?",
        );
      }
    } catch {
      /* malformed report — nothing to log */
    }
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
