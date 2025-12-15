import * as dotenv from 'dotenv';
dotenv.config();

import { runOnce } from './lambda';

// Simple CLI entrypoint to run the notification tick in DRY RUN mode.
// This will log which notifications would be triggered without writing
// anything back to Notion.

runOnce(true).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Dry-run failed:', err);
  process.exit(1);
});


