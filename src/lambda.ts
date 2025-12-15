import * as dotenv from 'dotenv';
dotenv.config();

import { LOG_LEVEL, TIMEZONE } from './config';
import { fetchAllNotifications, setTriggerForNotification, shouldTriggerNotification } from './notifications';

function logInfo(message: string, ...args: any[]) {
  if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
}

function logError(message: string, ...args: any[]) {
  // eslint-disable-next-line no-console
  console.error(message, ...args);
}

export async function runOnce(dryRun: boolean) {
  // Visual separator between runs
  logInfo('');
  logInfo(`========== Notification Central tick START (${dryRun ? 'DRY RUN' : 'LIVE'}) ==========`);  const startedAt = new Date().toISOString();
  logInfo(`Timestamp: ${startedAt} (configured timezone: ${TIMEZONE})`);

  try {
    const notifications = await fetchAllNotifications();

    let considered = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let triggered = 0;

    for (const notification of notifications) {
      considered += 1;

       if (notification.isActive) {
        activeCount += 1;
      } else {
        inactiveCount += 1;
      }

      if (!shouldTriggerNotification(notification)) {
        continue;
      }

      if (dryRun) {
        logInfo(`[DRY RUN] Would set trigger for "${notification.name}" (${notification.id})`);
        triggered += 1;
      } else {
        try {
          await setTriggerForNotification(notification.id);
          triggered += 1;
        } catch (err: any) {
          logError(
            `Failed to set trigger for notification "${notification.name}" (${notification.id}):`,
            err?.message || err
          );
        }
      }
    }

    logInfo(`Notifications summary: total=${notifications.length}, active=${activeCount}, inactive=${inactiveCount}`);
    logInfo(`Processed ${considered} notifications, triggered ${triggered}`);
    logInfo('========== Notification Central tick END ==========');
    logInfo('');
  } catch (err: any) {
    logError('Unhandled error during Lambda execution:', err?.message || err);
    throw err;
  }
}

export async function handler() {
  await runOnce(false);
}

// Allow local execution via ts-node / node for quick testing.
if (require.main === module) {
  runOnce(false).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Lambda handler failed:', err);
    process.exit(1);
  });
}


