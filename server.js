import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const env = globalThis.process?.env || {};

loadEnvFile(path.join(rootDir, ".env"));

const port = Number(env.PORT || 8791);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && env[key] == null) env[key] = value;
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 100000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function cleanIp(value) {
  if (!value) return "Unknown";
  return String(value).split(",")[0].trim().replace(/^::ffff:/, "");
}

function getVisitorIp(req) {
  return cleanIp(
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress
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
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\//.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua) && !/Chromium|Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return "Safari";
  return "Unknown browser";
}

function formatAlert(event, req) {
  const ip = getVisitorIp(req);
  const userAgent = event.userAgent || req.headers["user-agent"] || "";
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
  if (!url || typeof fetch !== "function") return;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Webhook failed: " + response.status);
}

async function sendTelegram(message) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || typeof fetch !== "function") return;
  await postJson("https://api.telegram.org/bot" + token + "/sendMessage", {
    chat_id: chatId,
    text: message,
    disable_web_page_preview: true
  });
}

async function sendNotifications(message) {
  const tasks = [
    sendTelegram(message),
    postJson(env.DISCORD_WEBHOOK_URL, { content: message }),
    postJson(env.SLACK_WEBHOOK_URL, { text: message })
  ];
  await Promise.allSettled(tasks);
}

async function handleViewEvent(req, res) {
  try {
    const event = await readJson(req);
    const message = formatAlert(event, req);
    console.log(message.replace(/\n/g, " | "));
    await sendNotifications(message);
    res.writeHead(204);
    res.end();
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid view event" }));
  }
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.normalize(path.join(rootDir, pathname));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

export const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url.split("?")[0] === "/api/view-event") {
    handleViewEvent(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405, { "Allow": "GET, HEAD, POST" });
  res.end("Method not allowed");
});

server.listen(port, () => {
  console.log("Justice Denison portfolio running at http://127.0.0.1:" + port + "/");
});
