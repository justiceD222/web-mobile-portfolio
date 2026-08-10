Justice Denison Portfolio - Cloudflare Workers Static Assets version

Use this package if your Cloudflare dashboard shows tabs like Deployments, Bindings, Observability, and Domains, and the build log says Wrangler is deploying assets.

Required GitHub root structure:
public/index.html
public/css/
public/img/
public/js/
src/worker.js
wrangler.jsonc
.gitignore
.env.example
README.txt

Cloudflare setting:
- Keep the project connected to GitHub.
- Push this structure to the repo root.
- The wrangler.jsonc file forces assets.directory to ./public so node_modules is not uploaded as a site asset.

Cloudflare secrets:
Workers & Pages > your project > Settings > Variables and Secrets

Add only the services you want:
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID

Do not upload .env or node_modules to GitHub.
