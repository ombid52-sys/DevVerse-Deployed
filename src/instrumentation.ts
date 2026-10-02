export async function register() {
  // Only execute within Node.js server runtime (exclude Edge or Client runtimes)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const isProduction = process.env.NODE_ENV === "production";
    const appUrl = process.env.APP_URL?.trim();

    // Active in production when a public HTTPS URL is configured
    if (isProduction && appUrl && appUrl.startsWith("https://")) {
      const PING_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes (Render idle threshold is 15 minutes)

      console.log(`[DevVerse KeepAlive] Initialized self-ping service targeting ${appUrl}/api/health every 12m.`);

      // Optional initial verification ping 30 seconds after server boot
      setTimeout(async () => {
        try {
          const res = await fetch(`${appUrl}/api/health`, {
            headers: { "x-keepalive-agent": "DevVerse-Boot-Probe" },
            cache: "no-store",
          });
          console.log(`[DevVerse KeepAlive] Initial boot probe dispatched: HTTP ${res.status}`);
        } catch (err: any) {
          console.warn(`[DevVerse KeepAlive] Initial boot probe notice: ${err.message}`);
        }
      }, 30 * 1000);

      // Periodic recurring keepalive loop
      setInterval(async () => {
        try {
          // Hits public domain through Render's external ingress router, resetting 15-minute idle counter
          const res = await fetch(`${appUrl}/api/health`, {
            headers: { "x-keepalive-agent": "DevVerse-KeepAlive-Ping" },
            cache: "no-store",
          });
          console.log(`[DevVerse KeepAlive] Self-ping successfully dispatched: HTTP ${res.status}`);
        } catch (err: any) {
          console.warn(`[DevVerse KeepAlive] Self-ping notice: ${err.message}`);
        }
      }, PING_INTERVAL_MS);
    } else {
      console.log("[DevVerse KeepAlive] Self-ping service skipped (not production or no public HTTPS APP_URL).");
    }
  }
}
