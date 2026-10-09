/**
 * Minimal structured logger. Technical details are logged server-side;
 * customers only ever see friendly messages.
 * Sensitive values are redacted by key name before anything is written.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|signed[-_]?url|signature|card/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : redact(inner, depth + 1);
  }
  return out;
}

function write(level: Level, event: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    event,
    time: new Date().toISOString(),
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else if (level === 'info' || process.env.NODE_ENV !== 'production') console.log(line);
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => write('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) => write('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => write('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => write('error', event, context),
};
