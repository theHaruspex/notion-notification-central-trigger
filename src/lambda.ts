import { LOG_LEVEL, TIMEZONE } from './config';
import { fetchAllNotifications, setTriggerForNotification, shouldTriggerNotification } from './notifications';
import { getCurrentSlot, isDueThisTick, parseTempo } from './tempo';

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

export async function handler() {
  const currentSlot = getCurrentSlot(TIMEZONE);
  logInfo(`Lambda tick at hour=${currentSlot.hour}, quarter=${currentSlot.quarter} (${TIMEZONE})`);

  try {
    const notifications = await fetchAllNotifications();

    let considered = 0;
    let triggered = 0;

    for (const notification of notifications) {
      considered += 1;

      const parsedTempo = parseTempo(notification.tempoRaw);

      if (!shouldTriggerNotification(notification, parsedTempo)) {
        continue;
      }

      if (!parsedTempo) {
        // shouldTriggerNotification already no-opped, but keep type narrowing happy
        continue;
      }

      if (!isDueThisTick(parsedTempo, currentSlot)) {
        continue;
      }

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

    logInfo(
      `Processed ${considered} notifications, triggered ${triggered} for slot ${currentSlot.hour}.${currentSlot.quarter}`
    );
  } catch (err: any) {
    logError('Unhandled error during Lambda execution:', err?.message || err);
    throw err;
  }
}

// Allow local execution via ts-node / node for quick testing.
if (require.main === module) {
  handler().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Lambda handler failed:', err);
    process.exit(1);
  });
}


