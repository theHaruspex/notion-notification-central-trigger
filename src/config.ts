/**
 * Configuration and constants for the Notification Central Lambda.
 *
 * All environment lookups are centralized here so the rest of the codebase
 * can assume strongly-typed, already-validated values.
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue!;
}

export const NOTION_API_KEY = getEnvVar('NOTION_API_KEY');

// Notification Central database configuration
export const NOTIFICATION_DB_ID = getEnvVar('NOTIFICATION_DB_ID');

// Non-secret runtime configuration (kept in code, not .env)
export const LOG_LEVEL: 'info' | 'debug' | 'silent' = 'info';
export const GLOBAL_RPS = 3;
export const TOKEN_BUCKET_CAPACITY = 3;

// Timezone in which Tempo hour.quarter values are interpreted.
export const TIMEZONE = 'America/Los_Angeles';

// Shared trigger key used between this integration and the Notion automation.
export const TRIGGER_KEY = 'NC_TRIGGER_V1';

// Notion property names (kept in one place so they are easy to change if needed)
export const PROP_NAME_TITLE = 'Name';
export const PROP_NAME_IS_ACTIVE = 'Is Active?';
export const PROP_NAME_TEMPO = 'Tempo';
export const PROP_NAME_TEMPO_VALIDATOR = 'Tempo Validator';
export const PROP_NAME_TRIGGER_KEY = 'Trigger: Key';
export const PROP_NAME_TRIGGER_TOGGLE = 'Trigger: Toggle';


