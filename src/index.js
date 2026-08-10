function cleanIp(value) {
  if (!value) return "Unknown";
  return String(value).split(",")[0].trim().replace(/^::ffff:/, "");
}

function getVisitorIp(request) {
  return cleanIp(
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")
  );
}

function detectDevice(userAgent, platform = "") {
  const ua = String((userAgent || "") + " " + (platform || "")).toLowerCase();

  if (ua.includes("ipad") || (ua.includes("macintosh") && ua.includes("mobile"))) return "iPad";
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("samsung") || ua.includes("sm-") || ua.includes("galaxy")) return "Samsung";
  if (ua.includes("android")) return "Android";
  if (ua.includes("macintosh") || ua.includes("mac os x") || ua.includes("macintel")) return "Macintosh";
  if (ua.includes("windows") || ua.includes("win32") || ua.includes("win64")) return "Windows";
  if (ua.includes("linux")) return "Linux";

  return "Unknown device";
}

function detectBrowser(userAgent) {
  const ua = userAgent || "";

  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/") && !ua.includes("Chromium") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg/")) return "Safari";

  return "Unknown browser";
}

function formatAlert(event, request) {
  const ip = getVisitorIp(request);
  const userAgent = event.userAgent || request.headers.get("user-agent") || "";
  const device = detectDevice(userAgent, event.platform);
  const browser = detectBrowser(userAgent);
  const screen = event.screen ? (event.screen.width || "?") + "x" + (event.screen.height || "?") : "Unknown";
  const viewport = event.viewport ? (event.viewport.width || "?") + "x" + (event.viewport.height || "?") : "Unknown";

  return [
    "Portfolio view detected",
    "Name: Justice Denison",
    "IP: " + ip,
    "Device: " + device,
    "Browser: " + browser,
    "Platform: " + (event.platform || "Unknown"),
    "Language: " + (event.language || "Unknown"),
    "Timezone: " + (event.timezone || "Unknown"),
    "Screen: " + screen,
    "Viewport: " + viewport,
    "Page: " + (event.pageUrl || "Unknown"),
    "Referrer: " + (event.referrer || "Direct / none"),
    "Viewed: " + (event.viewedAt || new Date().toISOString())
  ].join("\n");
}

async function postJson(url, payload) {
  if (!url) return;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("Webhook failed: " + response.status);
}

async function sendTelegram(env, message) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  await postJson("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", {
    chat_id: env.TELEGRAM_CHAT_ID,
    text: message,
    disable_web_page_preview: true
  });
}

async function sendNotifications(env, message) {
  await Promise.allSettled([
    sendTelegram(env, message),
    postJson(env.DISCORD_WEBHOOK_URL, { content: message }),
    postJson(env.SLACK_WEBHOOK_URL, { text: message })
  ]);
}

async function handleViewEvent(request, env, ctx) {
  let event;

  try {
    event = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const message = formatAlert(event, request);
  ctx.waitUntil(sendNotifications(env, message));

  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/view-event") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "POST" }
        });
      }

      return handleViewEvent(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  }
};
