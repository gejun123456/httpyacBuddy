import { DtoField, DtoParser } from '../parser/dtoParser';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

const SCALAR_MAP: Record<string, JsonValue> = {
  String: '',
  CharSequence: '',
  char: '',
  Character: '',

  byte: 0, Byte: 0,
  short: 0, Short: 0,
  int: 0, Integer: 0,
  long: 0, Long: 0,
  BigInteger: 0,

  float: 0.0, Float: 0.0,
  double: 0.0, Double: 0.0,
  BigDecimal: 0.0,

  boolean: false, Boolean: false,

  UUID: '00000000-0000-0000-0000-000000000000',

  LocalDate: '2026-01-01',
  LocalTime: '00:00:00',
  LocalDateTime: '2026-01-01T00:00:00',
  Date: '2026-01-01T00:00:00',
  Instant: '2026-01-01T00:00:00Z',
  OffsetDateTime: '2026-01-01T00:00:00+00:00',
  ZonedDateTime: '2026-01-01T00:00:00+00:00',
};

const COLLECTION_TYPES = new Set(['List', 'ArrayList', 'LinkedList', 'Set', 'HashSet', 'TreeSet', 'Collection', 'Iterable']);
const MAP_TYPES = new Set(['Map', 'HashMap', 'LinkedHashMap', 'TreeMap']);

/**
 * Strip leading qualifiers ("java.util.") so "java.util.List<X>" becomes "List<X>".
 */
function unqualify(type: string): string {
  return type.replace(/[\w.]*\.([A-Z]\w*)/g, '$1');
}

function parseGeneric(type: string): { base: string; args: string[] } {
  const t = unqualify(type).trim();
  const lt = t.indexOf('<');
  if (lt < 0) return { base: t, args: [] };
  const inner = t.slice(lt + 1, t.lastIndexOf('>'));
  const args = splitTopLevel(inner, ',');
  return { base: t.slice(0, lt), args };
}

function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '<' || c === '(' || c === '[' || c === '{') depth++;
    else if (c === '>' || c === ')' || c === ']' || c === '}') depth--;
    else if (c === sep && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

export class DefaultValueResolver {
  constructor(private dtoParser: DtoParser, private imports: Record<string, string>) {}

  async resolve(javaType: string, visited: Set<string> = new Set()): Promise<JsonValue> {
    const t = unqualify(javaType).trim();
    if (!t) return null;

    if (t.endsWith('[]')) {
      const inner = t.slice(0, -2);
      return [await this.resolve(inner, visited)];
    }
    const { base, args } = parseGeneric(t);

    if (base in SCALAR_MAP) return SCALAR_MAP[base];

    if (COLLECTION_TYPES.has(base)) {
      const elem = args[0] ?? 'Object';
      return [await this.resolve(elem, visited)];
    }
    if (MAP_TYPES.has(base)) return {};
    if (base === 'Optional') return args[0] ? await this.resolve(args[0], visited) : null;
    if (base === 'Object' || base === 'Void' || base === 'void') return null;

    // Treat as a DTO — recursively expand fields.
    if (visited.has(base)) return {};
    visited.add(base);
    const fields = await this.dtoParser.fields(base, this.imports);
    if (!fields) return null;
    const obj: { [k: string]: JsonValue } = {};
    for (const f of fields) {
      obj[f.name] = await this.resolve(f.javaType, new Set(visited));
    }
    return obj;
  }

  /**
   * Format a single value as a query string component (no JSON quotes around strings).
   */
  static toQueryString(v: JsonValue): string {
    if (v === null) return '';
    if (typeof v === 'string') return encodeURIComponent(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return encodeURIComponent(JSON.stringify(v));
  }
}

export type { DtoField };
