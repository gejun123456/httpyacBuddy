import * as path from 'path';
import * as vscode from 'vscode';

const CONFIG_PATTERNS = [
  '**/application.properties',
  '**/application.yml',
  '**/application.yaml',
  '**/application-*.properties',
  '**/application-*.yml',
  '**/application-*.yaml',
];

const CONFIG_EXCLUDE = '**/{node_modules,target,build,out,dist,.git}/**';

export async function resolveBaseUrl(controllerFilePath: string, fallbackBaseUrl: string): Promise<string> {
  const configured = getConfiguredBaseUrl(controllerFilePath);
  if (configured) return configured;

  const port = await findServerPort(controllerFilePath);
  return port ? `http://localhost:${port}` : fallbackBaseUrl;
}

function getConfiguredBaseUrl(controllerFilePath: string): string | null {
  const config = vscode.workspace.getConfiguration('springHttpBuddy', vscode.Uri.file(controllerFilePath));
  const inspected = config.inspect<string>('baseUrl');
  const hasExplicitValue = [
    'globalValue',
    'workspaceValue',
    'workspaceFolderValue',
    'globalLanguageValue',
    'workspaceLanguageValue',
    'workspaceFolderLanguageValue',
  ].some((key) => (inspected as Record<string, unknown> | undefined)?.[key] !== undefined);

  if (!hasExplicitValue) return null;

  const value = config.get<string>('baseUrl');
  return value?.trim() || null;
}

async function findServerPort(controllerFilePath: string): Promise<string | null> {
  const uris: vscode.Uri[] = [];
  for (const pattern of CONFIG_PATTERNS) {
    uris.push(...(await vscode.workspace.findFiles(pattern, CONFIG_EXCLUDE, 20)));
  }

  const unique = [...new Map(uris.map((uri) => [uri.fsPath, uri])).values()];
  unique.sort((a, b) => configScore(a.fsPath, controllerFilePath) - configScore(b.fsPath, controllerFilePath));

  for (const uri of unique) {
    let content: string;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      content = new TextDecoder('utf8').decode(bytes);
    } catch {
      continue;
    }

    const ext = path.extname(uri.fsPath).toLowerCase();
    const port = ext === '.properties' ? parsePropertiesPort(content) : parseYamlPort(content);
    if (port) return port;
  }

  return null;
}

function configScore(configPath: string, controllerFilePath: string): number {
  const baseName = path.basename(configPath).toLowerCase();
  const profilePenalty = /^application\.(properties|ya?ml)$/.test(baseName) ? 0 : 1000;
  const extPenalty = baseName.endsWith('.properties') ? 0 : 10;
  const distance = controllerFilePath.length - commonPrefixLength(normalizePath(configPath), normalizePath(controllerFilePath));
  return profilePenalty + extPenalty + distance;
}

function normalizePath(value: string): string {
  return value.split(path.sep).join('/').toLowerCase();
}

function commonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) i++;
  return i;
}

function parsePropertiesPort(content: string): string | null {
  for (const line of content.split(/\r?\n/)) {
    const cleaned = stripInlineComment(line).trim();
    if (!cleaned || cleaned.startsWith('#') || cleaned.startsWith('!')) continue;

    const match = cleaned.match(/^server\.port\s*[:=]\s*(.+)$/);
    if (!match) continue;

    const port = normalizePortValue(match[1]);
    if (port) return port;
  }
  return null;
}

function parseYamlPort(content: string): string | null {
  const lines = content.split(/\r?\n/);
  const serverIndents: number[] = [];

  for (const rawLine of lines) {
    const withoutComment = stripInlineComment(rawLine);
    if (!withoutComment.trim()) continue;

    const indent = withoutComment.match(/^\s*/)?.[0].length ?? 0;
    const line = withoutComment.trim();

    while (serverIndents.length > 0 && indent <= serverIndents[serverIndents.length - 1]) {
      serverIndents.pop();
    }

    const flatMatch = line.match(/^server\.port\s*:\s*(.+)$/);
    if (flatMatch) {
      const port = normalizePortValue(flatMatch[1]);
      if (port) return port;
    }

    if (line === 'server:' || line.startsWith('server: ')) {
      serverIndents.push(indent);
      const inlinePort = line.match(/^server:\s*\{\s*port\s*:\s*([^,}]+).*\}$/);
      if (inlinePort) {
        const port = normalizePortValue(inlinePort[1]);
        if (port) return port;
      }
      continue;
    }

    if (serverIndents.length > 0) {
      const nestedMatch = line.match(/^port\s*:\s*(.+)$/);
      if (nestedMatch) {
        const port = normalizePortValue(nestedMatch[1]);
        if (port) return port;
      }
    }
  }

  return null;
}

function stripInlineComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '#') return line.slice(0, i);
  }
  return line;
}

function normalizePortValue(raw: string): string | null {
  const value = raw.trim().replace(/^['"]|['"]$/g, '');
  const placeholderDefault = value.match(/^\$\{[^:}]+:(\d+)\}$/);
  const candidate = placeholderDefault ? placeholderDefault[1] : value;
  return /^\d{1,5}$/.test(candidate) ? candidate : null;
}
