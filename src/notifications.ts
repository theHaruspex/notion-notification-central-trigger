import type { QueryDatabaseResponse, PageObjectResponse } from '@notionhq/client/build/src/api-response';
import { LOG_LEVEL, NOTIFICATION_DB_ID, PROP_NAME_IS_ACTIVE, PROP_NAME_TEMPO, PROP_NAME_TITLE, PROP_NAME_TRIGGER_KEY, PROP_NAME_TRIGGER_TOGGLE, TRIGGER_KEY } from './config';
import { notion } from './notion-client';
import type { ParsedTempo } from './tempo';

export interface NotificationConfig {
  id: string;
  name: string;
  isActive: boolean;
  tempoRaw: string | null;
  triggerToggle: boolean | null;
}

function logDebug(message: string, ...args: any[]) {
  if (LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.debug(message, ...args);
  }
}

function logInfo(message: string, ...args: any[]) {
  if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
}

function extractPlainTextFromProperty(prop: any | undefined): string | null {
  if (!prop) return null;

  if (prop.type === 'rich_text' && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) {
    return prop.rich_text.map((t: any) => t.plain_text ?? '').join('').trim() || null;
  }

  if (prop.type === 'title' && Array.isArray(prop.title) && prop.title.length > 0) {
    return prop.title.map((t: any) => t.plain_text ?? '').join('').trim() || null;
  }

  if (prop.type === 'formula' && prop.formula?.type === 'string') {
    return (prop.formula.string ?? '').trim() || null;
  }

  return null;
}

function mapPageToNotification(page: PageObjectResponse): NotificationConfig {
  const props: any = page.properties;

  const titleProp = props[PROP_NAME_TITLE];
  const name = extractPlainTextFromProperty(titleProp) ?? page.id;

  const activeProp = props[PROP_NAME_IS_ACTIVE];
  const isActive = activeProp?.type === 'checkbox' ? Boolean(activeProp.checkbox) : false;

  const tempoProp = props[PROP_NAME_TEMPO];
  const tempoRaw = extractPlainTextFromProperty(tempoProp);

  const toggleProp = props[PROP_NAME_TRIGGER_TOGGLE];
  const triggerToggle =
    toggleProp && toggleProp.type === 'checkbox' ? Boolean(toggleProp.checkbox) : null;

  return {
    id: page.id,
    name,
    isActive,
    tempoRaw,
    triggerToggle,
  };
}

export async function fetchAllNotifications(): Promise<NotificationConfig[]> {
  const results: NotificationConfig[] = [];
  let cursor: string | undefined;

  do {
    const response: QueryDatabaseResponse = await notion.queryDatabase({
      database_id: NOTIFICATION_DB_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    const pageResults = (response.results as PageObjectResponse[])
      .filter((p) => p.object === 'page')
      .map(mapPageToNotification);

    results.push(...pageResults);

    cursor = response.has_more ? (response.next_cursor as string | undefined) : undefined;
  } while (cursor);

  logInfo(`Fetched ${results.length} notification configs from Notion`);

  return results;
}

/**
 * Given a notification config and parsed tempo, decide whether to trigger.
 * This function enforces the "no-op on bad state" rules:
 * - If not active -> no-op
 * - If malformed tempo (parseTempo returns null) -> no-op
 * - If Trigger Toggle is already true -> no-op
 */
export function shouldTriggerNotification(
  notification: NotificationConfig,
  parsedTempo: ParsedTempo | null
): boolean {
  if (!notification.isActive) {
    return false;
  }

  if (!parsedTempo) {
    logDebug(`Skipping "${notification.name}" due to malformed or empty Tempo`);
    return false;
  }

  if (notification.triggerToggle === true) {
    logDebug(`Skipping "${notification.name}" because Trigger Toggle is already true`);
    return false;
  }

  return true;
}

export async function setTriggerForNotification(pageId: string): Promise<void> {
  logDebug(`Setting trigger for page ${pageId}`);

  await notion.updatePage({
    page_id: pageId,
    properties: {
      [PROP_NAME_TRIGGER_KEY]: {
        rich_text: [
          {
            text: {
              content: TRIGGER_KEY,
            },
          },
        ],
      },
      [PROP_NAME_TRIGGER_TOGGLE]: {
        checkbox: true,
      },
    },
  });
}


