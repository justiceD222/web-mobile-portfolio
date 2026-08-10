Justice Denison Portfolio - Cloudflare Pages public output version

Put this entire folder content at the root of the GitHub repository connected to Cloudflare Pages.

Required structure:
public/index.html
public/css/
public/img/
public/js/
functions/api/view-event.js
.gitignore
.env.example
README.txt

Cloudflare Pages settings:
- Framework preset: None
- Build command: leave empty
- Build output directory: public
- Root directory: repository root

Cloudflare secrets:
Workers & Pages > your Pages project > Settings > Variables and Secrets

Add only the services you want:
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID

Do not upload .env or node_modules to GitHub.
