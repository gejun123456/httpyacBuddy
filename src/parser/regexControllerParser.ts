import { ControllerInfo, HttpMethod, MethodInfo, ParameterInfo, ParameterKind } from '../types';
import { ControllerParser } from './controllerParser';

const MAPPING_TO_METHOD: Record<string, HttpMethod> = {
  GetMapping: 'GET',
  PostMapping: 'POST',
  PutMapping: 'PUT',
  DeleteMapping: 'DELETE',
  PatchMapping: 'PATCH',
};

const FRAMEWORK_INJECT_TYPES = new Set([
  'HttpServletRequest',
  'HttpServletResponse',
  'HttpSession',
  'ServletRequest',
  'ServletResponse',
  'Model',
  'ModelMap',
  'Principal',
  'Authentication',
  'BindingResult',
  'RedirectAttributes',
  'UriComponentsBuilder',
  'MultipartFile',
]);

const SCALAR_TYPES = new Set([
  'String', 'CharSequence',
  'byte', 'Byte', 'short', 'Short', 'int', 'Integer', 'long', 'Long',
  'float', 'Float', 'double', 'Double',
  'boolean', 'Boolean', 'char', 'Character',
  'BigDecimal', 'BigInteger',
  'LocalDate', 'LocalDateTime', 'LocalTime', 'Date', 'Instant', 'OffsetDateTime', 'ZonedDateTime',
  'UUID',
]);

export class RegexControllerParser implements ControllerParser {
  parse(source: string, filePath: string): ControllerInfo | null {
    const stripped = stripComments(source);
    if (!/@(Rest)?Controller\b/.test(stripped)) return null;

    const className = extractClassName(stripped);
    if (!className) return null;

    const imports = extractImports(stripped);
    const basePath = extractClassBasePath(stripped);
    const classLine = findClassLine(source, className);
    const classBody = findClassBodyRange(stripped, className);
    const methods = classBody ? extractMethods(stripped, classBody.start, classBody.end) : [];

    return { className, classLine, basePath, imports, filePath, methods };
  }
}

function extractImports(source: string): Record<string, string> {
  const imports: Record<string, string> = {};
  const re = /^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const fqn = m[1];
    const simple = fqn.split('.').pop()!;
    if (simple !== '*') imports[simple] = fqn;
  }
  return imports;
}

function extractClassName(source: string): string | null {
  const m = source.match(/\bclass\s+(\w+)/);
  return m ? m[1] : null;
}

function findClassLine(source: string, className: string): number {
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`\\bclass\\s+${className}\\b`).test(lines[i])) return i;
  }
  return 0;
}

function findClassBodyRange(source: string, className: string): { start: number; end: number } | null {
  const classMatch = new RegExp(`\\bclass\\s+${escapeRegex(className)}\\b`).exec(source);
  if (!classMatch) return null;
  const open = source.indexOf('{', classMatch.index + classMatch[0].length);
  if (open < 0) return null;
  const close = findBalanced(source, open, '{', '}');
  if (close < 0) return null;
  return { start: open + 1, end: close };
}

function extractClassBasePath(source: string): string {
  // Find @RequestMapping that appears before the class declaration
  const classIdx = source.search(/\bclass\s+\w+/);
  if (classIdx < 0) return '';
  const head = source.slice(0, classIdx);
  const m = head.match(/@RequestMapping\s*\(([^)]*)\)/);
  if (!m) return '';
  return extractPathFromArgs(m[1]);
}

function extractMethods(stripped: string, start: number, end: number): MethodInfo[] {
  const methods: MethodInfo[] = [];
  const mappingRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\b/g;
  mappingRegex.lastIndex = start;
  let m: RegExpExecArray | null;
  while ((m = mappingRegex.exec(stripped))) {
    if (m.index >= end) break;
    const annKind = m[1];
    const annStart = m.index;
    // Find optional (...) args
    let p = annStart + m[0].length;
    p = skipWs(stripped, p);
    let argText = '';
    let afterAnnPos = p;
    if (stripped[p] === '(') {
      const close = findBalanced(stripped, p, '(', ')');
      if (close < 0) continue;
      if (close >= end) break;
      argText = stripped.slice(p + 1, close);
      afterAnnPos = close + 1;
    }
    const sig = parseMethodSignatureAfter(stripped, afterAnnPos);
    if (!sig) continue;

    const pathSuffix = extractPathFromArgs(argText);
    const httpMethods = annKind === 'RequestMapping' ? extractMethodsFromArgs(argText, 'GET') : [MAPPING_TO_METHOD[annKind]];
    if (httpMethods.length === 0) continue;

    const params = sig.params.map(parseParameter).filter((x): x is ParsedParam => !!x);
    const { pathVariables, queryParams, headers, requestBody } = classifyParameters(params);

    for (const httpMethod of httpMethods) {
      methods.push({
        name: sig.name,
        annotationLine: countLinesBefore(stripped, annStart),
        httpMethod,
        pathSuffix,
        pathVariables,
        queryParams,
        headers,
        requestBody,
      });
    }
  }
  return methods;
}

// ---- helpers ----

function stripComments(source: string): string {
  let out = '';
  let i = 0;
  let inStr: string | null = null;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\' && i + 1 < source.length) { out += next; i += 2; continue; }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'") { inStr = c; out += c; i++; continue; }
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') { i++; }
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function skipWs(s: string, p: number): number {
  while (p < s.length && /\s/.test(s[p])) p++;
  return p;
}

function findBalanced(s: string, openPos: number, open: string, close: string): number {
  let depth = 0;
  let inStr: string | null = null;
  for (let i = openPos; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitTopLevel(s: string, sep: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let start = 0;
  let inStr: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === '(' || c === '<' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === '>' || c === ']' || c === '}') depth--;
    else if (c === sep && depth === 0) {
      result.push(s.slice(start, i));
      start = i + 1;
    }
  }
  result.push(s.slice(start));
  return result.map((x) => x.trim()).filter(Boolean);
}

// stripComments preserves every newline, so position → line is just a newline count.
function countLinesBefore(text: string, pos: number): number {
  let line = 0;
  for (let i = 0; i < pos; i++) if (text[i] === '\n') line++;
  return line;
}

function parseMethodSignatureAfter(text: string, start: number): { name: string; params: string[] } | null {
  let p = start;
  while (p < text.length) {
    p = skipWs(text, p);
    if (p >= text.length) return null;
    if (text[p] === '@') {
      p++;
      while (p < text.length && /[\w.]/.test(text[p])) p++;
      p = skipWs(text, p);
      if (text[p] === '(') {
        const close = findBalanced(text, p, '(', ')');
        if (close < 0) return null;
        p = close + 1;
      }
      continue;
    }
    const mod = text.slice(p).match(/^(public|private|protected|static|final|abstract|default|synchronized|native|strictfp)\b/);
    if (mod) { p += mod[0].length; continue; }
    break;
  }

  // Now we should be at: <return-type> <name>(params)
  let depth = 0;
  let identStart = -1;
  let lastIdentStart = -1;
  let lastIdentEnd = -1;
  let inStr: string | null = null;
  while (p < text.length) {
    const c = text[p];
    if (inStr) {
      if (c === '\\') { p += 2; continue; }
      if (c === inStr) inStr = null;
      p++;
      continue;
    }
    if (depth === 0 && c === '(') {
      if (lastIdentStart < 0) return null;
      const name = text.slice(lastIdentStart, lastIdentEnd);
      const close = findBalanced(text, p, '(', ')');
      if (close < 0) return null;
      const inner = text.slice(p + 1, close);
      const params = splitTopLevel(inner, ',');
      return { name, params };
    }
    if (c === '"' || c === "'") { inStr = c; p++; continue; }
    if (c === '<') depth++;
    else if (c === '>') depth--;
    if (/\w/.test(c)) {
      if (identStart < 0) identStart = p;
      lastIdentStart = identStart;
      lastIdentEnd = p + 1;
    } else {
      identStart = -1;
    }
    p++;
  }
  return null;
}

interface ParsedParam {
  annotations: { name: string; argText: string }[];
  javaType: string;
  paramName: string;
}

function parseParameter(raw: string): ParsedParam | null {
  let p = 0;
  const annotations: { name: string; argText: string }[] = [];
  while (p < raw.length) {
    p = skipWs(raw, p);
    if (raw[p] !== '@') break;
    p++;
    const start = p;
    while (p < raw.length && /[\w.]/.test(raw[p])) p++;
    const name = raw.slice(start, p);
    let argText = '';
    p = skipWs(raw, p);
    if (raw[p] === '(') {
      const close = findBalanced(raw, p, '(', ')');
      if (close < 0) return null;
      argText = raw.slice(p + 1, close);
      p = close + 1;
    }
    annotations.push({ name, argText });
  }
  const rest = raw.slice(p).trim();
  if (!rest) return null;
  // The parameter name is the last identifier token (possibly preceded by `final`).
  const m = rest.match(/^(.+?)\s+(\w+)\s*$/);
  if (!m) return null;
  let javaType = m[1].trim();
  javaType = javaType.replace(/^final\s+/, '').trim();
  return { annotations, javaType, paramName: m[2] };
}

function classifyParameters(params: ParsedParam[]) {
  const pathVariables: ParameterInfo[] = [];
  const queryParams: ParameterInfo[] = [];
  const headers: ParameterInfo[] = [];
  let requestBody: ParameterInfo | undefined;

  for (const p of params) {
    if (isFrameworkInject(p.javaType)) continue;

    const ann = p.annotations.find((a) =>
      ['PathVariable', 'RequestParam', 'RequestHeader', 'RequestBody', 'ModelAttribute'].includes(a.name)
    );
    let kind: ParameterKind;
    let expandObject = false;
    if (ann) {
      if (ann.name === 'PathVariable') kind = 'path';
      else if (ann.name === 'RequestHeader') kind = 'header';
      else if (ann.name === 'RequestBody') kind = 'body';
      else {
        kind = 'query';
        expandObject = ann.name === 'ModelAttribute' && !isScalarType(p.javaType);
      }
    } else {
      kind = 'query';
      expandObject = !isScalarType(p.javaType);
    }

    const info: ParameterInfo = {
      name: extractAnnotationName(ann?.argText) ?? p.paramName,
      javaType: p.javaType,
      required: extractAnnotationRequired(ann?.argText) ?? true,
      defaultValue: extractAnnotationDefault(ann?.argText),
      kind,
      expandObject,
    };

    if (kind === 'path') pathVariables.push(info);
    else if (kind === 'query') queryParams.push(info);
    else if (kind === 'header') headers.push(info);
    else if (kind === 'body' && !requestBody) requestBody = info;
  }

  return { pathVariables, queryParams, headers, requestBody };
}

function isFrameworkInject(type: string): boolean {
  const base = type.replace(/<.*$/, '').trim();
  return FRAMEWORK_INJECT_TYPES.has(base);
}

function isScalarType(type: string): boolean {
  const base = type.replace(/<.*$/, '').replace(/\[\]/g, '').trim();
  return SCALAR_TYPES.has(base);
}

function extractPathFromArgs(args: string): string {
  if (!args.trim()) return '';
  // Try named value/path first
  let m = args.match(/\b(?:value|path)\s*=\s*"([^"]*)"/);
  if (m) return m[1];
  m = args.match(/\b(?:value|path)\s*=\s*\{\s*"([^"]*)"/);
  if (m) return m[1];
  // Positional string: first "..." not preceded by `name =`
  m = args.match(/(?:^|[\s,])"([^"]*)"/);
  if (m) return m[1];
  m = args.match(/\{\s*"([^"]*)"/);
  if (m) return m[1];
  return '';
}

function extractMethodsFromArgs(args: string, defaultMethod: HttpMethod): HttpMethod[] {
  const m = args.match(/method\s*=\s*(\{[^}]*\}|[^,)]+)/);
  if (!m) return [defaultMethod];
  const raw = m[1].replace(/^\s*\{\s*/, '').replace(/\s*\}\s*$/, '');
  const methods: HttpMethod[] = [];
  for (const part of splitTopLevel(raw, ',')) {
    const value = part.replace(/\bRequestMethod\./g, '').trim().toUpperCase();
    if (isHttpMethod(value) && !methods.includes(value)) methods.push(value);
  }
  return methods;
}

function isHttpMethod(value: string): value is HttpMethod {
  return value === 'GET' || value === 'POST' || value === 'PUT' || value === 'DELETE' || value === 'PATCH';
}

function extractAnnotationName(args?: string): string | null {
  if (!args) return null;
  let m = args.match(/\b(?:name|value)\s*=\s*"([^"]*)"/);
  if (m) return m[1];
  m = args.match(/^\s*"([^"]*)"/);
  if (m) return m[1];
  return null;
}

function extractAnnotationRequired(args?: string): boolean | null {
  if (!args) return null;
  const m = args.match(/required\s*=\s*(true|false)/);
  return m ? m[1] === 'true' : null;
}

function extractAnnotationDefault(args?: string): string | undefined {
  if (!args) return undefined;
  const m = args.match(/defaultValue\s*=\s*"([^"]*)"/);
  return m ? m[1] : undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
