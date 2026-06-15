import * as vscode from 'vscode';

export interface DtoField {
  name: string;
  javaType: string;
}

export class DtoParser {
  private cache = new Map<string, DtoField[] | null>();

  clearCache(): void {
    this.cache.clear();
  }

  async fields(simpleName: string, imports: Record<string, string>): Promise<DtoField[] | null> {
    const cacheKey = imports[simpleName] ?? simpleName;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const uri = await this.findClassFile(simpleName, imports);
    if (!uri) {
      this.cache.set(cacheKey, null);
      return null;
    }
    let source: string;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      source = new TextDecoder('utf8').decode(bytes);
    } catch {
      this.cache.set(cacheKey, null);
      return null;
    }
    const fields = extractFields(source);
    this.cache.set(cacheKey, fields);
    return fields;
  }

  private async findClassFile(simpleName: string, imports: Record<string, string>): Promise<vscode.Uri | null> {
    const fqn = imports[simpleName];
    if (fqn) {
      const relativePath = fqn.replace(/\./g, '/') + '.java';
      const matches = await vscode.workspace.findFiles(`**/${relativePath}`, '**/{node_modules,target,build,out,dist}/**', 1);
      if (matches.length > 0) return matches[0];
    }
    const matches = await vscode.workspace.findFiles(`**/${simpleName}.java`, '**/{node_modules,target,build,out,dist}/**', 1);
    return matches.length > 0 ? matches[0] : null;
  }
}

function extractFields(source: string): DtoField[] {
  const stripped = stripComments(source);
  const fields: DtoField[] = [];
  // Match: optional annotations, modifier, optional static/final/transient/volatile, type, name, '=' or ';'
  // Reject lines containing '(' between modifier and ';' (those are methods).
  const re = /\b(?:private|protected|public)\s+(?:(?:static|final|transient|volatile)\s+)*([\w.<>?,\s\[\]]+?)\s+(\w+)\s*(?:=[^;]*)?;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) {
    const type = m[1].trim();
    const name = m[2].trim();
    // Skip if type looks malformed (contains parentheses)
    if (type.includes('(') || type.includes(')')) continue;
    // Skip serialVersionUID and similar
    if (name === 'serialVersionUID') continue;
    fields.push({ javaType: type, name });
  }
  return fields;
}

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
      while (i < source.length && source[i] !== '\n') i++;
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
