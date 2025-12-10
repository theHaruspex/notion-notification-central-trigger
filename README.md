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
- `Tempo` (text, `hour.quarter` CSV like `9.1, 14.3`)
- `Trigger: Key` (text/rich text)
- `Trigger: Toggle` (checkbox)

All other behavior (timezone, log level, trigger key value, rate limits) is configured directly in `src/config.ts` so that only secrets live in `.env`.

### Running locally

- **Directly with ts-node**:

```bash
npm start
```

- **Compile then run**:

```bash
npm run build
npm run start:compiled
```

The deployed Lambda should have its handler set to `dist/lambda.handler` and be triggered by an EventBridge schedule (e.g. every 15 minutes).

