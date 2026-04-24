export type DeliveryMode = 'auto' | 'eas' | 'storage' | 'local';

export function sanitizeAppName(input: string): string {
  const normalized = input.trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Monitor';
  return normalized.slice(0, 50);
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function toOptionalValidLogoUrl(input: string): string | undefined {
  const normalized = normalizeUrl(input);
  if (!normalized) return undefined;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function toRequiredValidUrl(input: string): string | null {
  const normalized = normalizeUrl(input);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizePackageSegment(raw: string): string {
  const ascii = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '')
    .replace(/_+/g, '_');

  if (!ascii) return 'monitor';

  const startsWithLetter = /^[a-z]/.test(ascii);
  const safe = startsWithLetter ? ascii : `app_${ascii}`;

  return safe.slice(0, 30);
}

export function buildPackageName(companyName: string): string {
  const segment = sanitizePackageSegment(companyName);
  return `com.${segment}.monitor`;
}
