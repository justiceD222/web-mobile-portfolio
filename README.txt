Justice Denison Portfolio - Cloudflare Pages version

Upload these files to the root of the GitHub repository connected to Cloudflare Pages:

index.html
css/
img/
js/
functions/api/view-event.js
.gitignore
.env.example
README.txt

Cloudflare Pages settings:
- Build command: leave empty
- Build output directory: /
- Root directory: repository root

Cloudflare secrets:
Workers & Pages > your Pages project > Settings > Variables and Secrets

Add only the services you want to use:
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID

Do not upload .env or node_modules to GitHub.
