import { ControllerInfo, MethodInfo, ParameterInfo } from '../types';
import { DtoParser } from '../parser/dtoParser';
import { DefaultValueResolver, JsonValue } from './defaultValues';

export const DEFAULT_BASE_URL = 'http://localhost:8080';

export interface RenderResult {
  /** Full text for the new ### block (without leading or trailing newlines). */
  text: string;
}

/**
 * Render a single `### blockName` request block. The result does not include
 * surrounding blank lines; the caller is responsible for separating blocks.
 */
export async function renderBlock(
  controller: ControllerInfo,
  method: MethodInfo,
  blockName: string,
  dtoParser: DtoParser,
  baseUrl = DEFAULT_BASE_URL
): Promise<RenderResult> {
  const resolver = new DefaultValueResolver(dtoParser, controller.imports);

  let url = trimTrailingSlash(baseUrl || DEFAULT_BASE_URL) + joinPath(controller.basePath, method.pathSuffix);

  // Substitute path variables.
  for (const pv of method.pathVariables) {
    const value = pickPathValue(pv);
    url = url.replace(new RegExp(`\\{${escape(pv.name)}(?::[^}]*)?\\}`, 'g'), String(value));
  }

  const formParams = method.requestBody
    ? []
    : method.queryParams.filter((q) => q.expandObject === true && method.httpMethod !== 'GET');
  const formParamSet = new Set(formParams);
  const urlQueryParams = method.queryParams.filter((q) => !formParamSet.has(q));

  if (urlQueryParams.length > 0) {
    const parts: string[] = [];
    for (const q of urlQueryParams) {
      const raw = q.defaultValue ?? (await resolver.resolve(q.javaType, q.name));
      appendQueryParts(parts, q.name, raw as JsonValue, q.expandObject === true);
    }
    if (parts.length > 0) url += '?' + parts.join('&');
  }

  let formBody: string | null = null;
  if (formParams.length > 0) {
    const parts: string[] = [];
    for (const q of formParams) {
      const raw = q.defaultValue ?? (await resolver.resolve(q.javaType, q.name));
      appendQueryParts(parts, q.name, raw as JsonValue, true);
    }
    if (parts.length > 0) formBody = parts.join('&');
  }

  const lines: string[] = [];
  lines.push(`### ${blockName}`);
  lines.push(`${method.httpMethod} ${url}`);

  let bodyJson: string | null = null;
  if (method.requestBody) {
    const v = await resolver.resolve(method.requestBody.javaType, method.requestBody.name);
    bodyJson = JSON.stringify(v, null, 2);
    lines.push('Content-Type: application/json');
  }
  if (formBody !== null) {
    lines.push('Content-Type: application/x-www-form-urlencoded');
  }

  for (const h of method.headers) {
    const raw = h.defaultValue ?? (await resolver.resolve(h.javaType, h.name));
    lines.push(`${h.name}: ${formatHeaderValue(raw as JsonValue)}`);
  }

  if (bodyJson !== null || formBody !== null) {
    lines.push('');
    lines.push(bodyJson ?? formBody ?? '');
  }

  return { text: lines.join('\n') };
}

function joinPath(base: string, suffix: string): string {
  const b = (base || '').replace(/\/+$/, '');
  const s = (suffix || '').replace(/^\/+/, '');
  if (!b && !s) return '/';
  if (!s) return b.startsWith('/') ? b : '/' + b;
  if (!b) return s.startsWith('/') ? s : '/' + s;
  return (b.startsWith('/') ? b : '/' + b) + '/' + s;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function pickPathValue(p: ParameterInfo): string {
  if (p.defaultValue !== undefined) return p.defaultValue;
  const base = p.javaType.replace(/<.*$/, '').trim();
  if (['int', 'Integer', 'long', 'Long', 'short', 'Short', 'byte', 'Byte', 'BigInteger'].includes(base)) return '1';
  if (['float', 'Float', 'double', 'Double', 'BigDecimal'].includes(base)) return '1.0';
  if (['boolean', 'Boolean'].includes(base)) return 'true';
  if (base === 'UUID') return '00000000-0000-0000-0000-000000000000';
  if (isIdLikeName(p.name)) return '1';
  return p.name;
}

function isIdLikeName(name: string): boolean {
  return /(^id$|[_-]id$|Id$)/.test(name);
}

function formatHeaderValue(v: JsonValue): string {
  if (v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function appendQueryParts(parts: string[], name: string, value: JsonValue, expandObject: boolean): void {
  if (!expandObject || value === null || typeof value !== 'object') {
    parts.push(`${encodeURIComponent(name)}=${DefaultValueResolver.toQueryString(value)}`);
    return;
  }

  const before = parts.length;
  flattenQueryObject(parts, '', value);
  if (parts.length === before) {
    parts.push(`${encodeURIComponent(name)}=`);
  }
}

function flattenQueryObject(parts: string[], prefix: string, value: JsonValue): void {
  if (value === null || typeof value !== 'object') {
    if (prefix) parts.push(`${encodeURIComponent(prefix)}=${DefaultValueResolver.toQueryString(value)}`);
    return;
  }

  if (Array.isArray(value)) {
    if (!prefix) return;
    if (value.length === 0) {
      parts.push(`${encodeURIComponent(prefix)}=`);
      return;
    }
    value.forEach((item, index) => flattenQueryObject(parts, `${prefix}[${index}]`, item));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childName = prefix ? `${prefix}.${key}` : key;
    flattenQueryObject(parts, childName, child);
  }
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
