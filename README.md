## Notion Notification Central Trigger

Backend Lambda-style integration that checks a Notion database of notification configs every 15 minutes and, when due, flips a Trigger Toggle so Notion Automations can send notifications.

### Setup

- **Install dependencies**

```bash
npm install
```

- **Environment variables**

Create a `.env` file in the project root with at least:

```bash
NOTION_API_KEY=secret_xxx
NOTIFICATION_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Property names in Notion are currently assumed to match the CSV export:

- `Name` (title)
- `Is Active?` (checkbox)
- `Is Primed?, Value` (formula/checkbox used to decide if this tick should fire; Lambda only fires when this is `true`)
- `Trigger: Key` (text/rich text)
- `Trigger: Toggle` (checkbox)

All other behavior (timezone, log level, trigger key value, rate limits) is configured directly in `src/config.ts` so that only secrets live in `.env`.

### Running locally

- **Directly with ts-node (live run)**:

```bash
npm start
```

- **Compile then run**:

```bash
npm run build
npm run start:compiled
```

- **Dry run (no writes, just logs what would trigger)**:

```bash
npm run dry-run
```

This uses `src/dry-run.ts`, which calls the shared tick runner in DRY RUN mode so it never writes Trigger Key / Trigger Toggle back to Notion.

The deployed Lambda should have its handler set to `dist/lambda.handler` and be triggered by an EventBridge schedule (e.g. every 15 minutes).

### Deployment notes (EC2 + pm2 + GitHub Actions)

- **App host**: Deployed on an EC2 instance (Debian 12) reachable as `admin@<EC2_HOST>` (currently `3.131.200.212`).
- **Runtime**: Node.js 22 + pm2 running the compiled `dist/lambda.js` on a 15‑minute cron.
- **Deploy workflow**:
  - GitHub Actions workflow at `.github/workflows/deploy.yml` uses `appleboy/ssh-action` to SSH into the instance as `admin`, `cd` into `/opt/myapp/notion-notification-central-trigger`, `git fetch && git reset --hard origin/main`, `npm ci`, `npm run build`, and `pm2 reload notion-notification-central-trigger --update-env`.
- **Private repo + deploy key**:
  - On EC2 as `appuser`, generated a deploy key: `ssh-keygen -t ed25519 -C "notion-notification-central-trigger-ec2" -f ~/.ssh/id_ed25519_github -N ""`.
  - Added the **public** key (`ssh-ed25519 AAAA... notion-notification-central-trigger-ec2`) as a **Deploy key** on this repo (read-only).
  - Updated the remote on EC2 to use SSH: `git remote set-url origin git@github.com:theHaruspex/notion-notification-central-trigger.git`.
  - This lets the EC2 box pull from the private repo without passwords.


