import { ControllerInfo, MethodInfo, ParameterInfo } from '../types';
import { DtoParser } from '../parser/dtoParser';
import { DefaultValueResolver, JsonValue } from './defaultValues';

const BASE_URL = 'http://localhost:8080';

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
  dtoParser: DtoParser
): Promise<RenderResult> {
  const resolver = new DefaultValueResolver(dtoParser, controller.imports);

  let url = BASE_URL + joinPath(controller.basePath, method.pathSuffix);

  // Substitute path variables.
  for (const pv of method.pathVariables) {
    const value = pickPathValue(pv);
    url = url.replace(new RegExp(`\\{${escape(pv.name)}(?::[^}]*)?\\}`, 'g'), String(value));
  }

  // Query string.
  if (method.queryParams.length > 0) {
    const parts: string[] = [];
    for (const q of method.queryParams) {
      const raw = q.defaultValue ?? (await resolver.resolve(q.javaType));
      parts.push(`${encodeURIComponent(q.name)}=${DefaultValueResolver.toQueryString(raw as JsonValue)}`);
    }
    url += '?' + parts.join('&');
  }

  const lines: string[] = [];
  lines.push(`### ${blockName}`);
  lines.push(`${method.httpMethod} ${url}`);

  let bodyJson: string | null = null;
  if (method.requestBody) {
    const v = await resolver.resolve(method.requestBody.javaType);
    bodyJson = JSON.stringify(v, null, 2);
    lines.push('Content-Type: application/json');
  }

  for (const h of method.headers) {
    const raw = h.defaultValue ?? (await resolver.resolve(h.javaType));
    lines.push(`${h.name}: ${formatHeaderValue(raw as JsonValue)}`);
  }

  if (bodyJson !== null) {
    lines.push('');
    lines.push(bodyJson);
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

function pickPathValue(p: ParameterInfo): string {
  if (p.defaultValue !== undefined) return p.defaultValue;
  const base = p.javaType.replace(/<.*$/, '').trim();
  if (['int', 'Integer', 'long', 'Long', 'short', 'Short', 'byte', 'Byte', 'BigInteger'].includes(base)) return '1';
  if (['float', 'Float', 'double', 'Double', 'BigDecimal'].includes(base)) return '1.0';
  if (['boolean', 'Boolean'].includes(base)) return 'true';
  if (base === 'UUID') return '00000000-0000-0000-0000-000000000000';
  return p.name;
}

function formatHeaderValue(v: JsonValue): string {
  if (v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
