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
  const ua = String((userAgent || "") + " " + (platform || ""));
  if (/ipad/i.test(ua) || (/macintosh/i.test(ua) && /mobile/i.test(ua))) return "iPad";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/samsung|sm-|galaxy/i.test(ua)) return "Samsung";
  if (/android/i.test(ua)) return "Android";
  if (/macintosh|mac os x|macintel/i.test(ua)) return "Macintosh";
  if (/windows|win32|win64/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown device";
}

function detectBrowser(userAgent) {
  const ua = userAgent || "";
  if (/Edg//.test(ua)) return "Microsoft Edge";
  if (/OPR//.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Firefox//.test(ua)) return "Firefox";
  if (/Chrome//.test(ua) && !/Chromium|Edg//.test(ua)) return "Chrome";
  if (/Safari//.test(ua) && !/Chrome|Chromium|Edg//.test(ua)) return "Safari";
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
  ].join("
");
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

export async function onRequestPost(context) {
  const { request, env } = context;

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
  context.waitUntil(sendNotifications(env, message));

  return new Response(null, { status: 204 });
}

export function onRequestGet() {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST" }
  });
}
