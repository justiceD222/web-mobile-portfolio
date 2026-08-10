How to open the portfolio:

1. Static preview only:
   Double-click index.html.
   This shows the portfolio, but visitor IP and alert messages will NOT work.

2. Full version with visitor alerts:
   Double-click start-portfolio.bat, or open a terminal in this folder and run:
   node server.js

   Then open:
   http://127.0.0.1:8791/

Visitor alerts:
- Copy .env.example to .env or set the same environment variables on your host.
- Add Telegram, Discord, and Slack webhook values.
- Keep the command window open while the portfolio is running.

The tracker uses /api/view-event so webhook secrets stay off the public page. Opening index.html directly with file:// cannot securely collect visitor IP or send private notifications.

Cloudflare Pages deployment:
- GitHub repo root must contain index.html, js/, css/, img/, and functions/api/view-event.js.
- Cloudflare Pages will serve index.html as the site and expose /api/view-event through Pages Functions.
- In Cloudflare dashboard, open Workers & Pages > your Pages project > Settings > Variables and Secrets.
- Add TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DISCORD_WEBHOOK_URL, and SLACK_WEBHOOK_URL as secrets or environment variables.
- Push to GitHub. Cloudflare will redeploy automatically.
