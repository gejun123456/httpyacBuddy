export interface HttpBlock {
  name: string;
  line: number;
}

/**
 * Scan a .http file content and return every `### blockName` header.
 */
export function listAllBlocks(content: string): HttpBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: HttpBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^###\s+(.+?)\s*$/);
    if (m) blocks.push({ name: m[1], line: i });
  }
  return blocks;
}

/**
 * Return blocks whose name is `methodName` or `methodName_<n>`.
 */
export function listMatchingBlocks(content: string, methodName: string): HttpBlock[] {
  const all = listAllBlocks(content);
  const re = new RegExp(`^${escapeRegex(methodName)}(?:_\\d+)?$`);
  return all.filter((b) => re.test(b.name));
}

/**
 * Decide the new block name when appending. If `methodName` is unused, return
 * it as-is; otherwise return `methodName_N` where N is one greater than the
 * largest existing suffix (minimum 2).
 */
export function nextBlockName(content: string, methodName: string): string {
  const existing = new Set(listAllBlocks(content).map((b) => b.name));
  if (!existing.has(methodName)) return methodName;
  let max = 1;
  const re = new RegExp(`^${escapeRegex(methodName)}_(\\d+)$`);
  for (const n of existing) {
    const m = n.match(re);
    if (m) {
      const v = Number(m[1]);
      if (v > max) max = v;
    }
  }
  return `${methodName}_${max + 1}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
