import * as path from 'path';
import * as vscode from 'vscode';
import { MethodInfo } from '../types';

export async function findControllerJavaFile(httpPath: string, className: string): Promise<vscode.Uri | null> {
  const matches = await vscode.workspace.findFiles(`**/${className}.java`, '**/{node_modules,target,build,out,dist,.git}/**');
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const preferredRoot = inferMainJavaRoot(httpPath);
  const ranked = matches
    .map((uri) => ({ uri, score: scoreJavaCandidate(uri.fsPath, httpPath, preferredRoot) }))
    .sort((a, b) => a.score - b.score);

  return ranked[0].uri;
}

export function extractMethodSource(document: vscode.TextDocument, method: MethodInfo): string {
  const text = document.getText();
  const startLine = Math.min(method.annotationLine, Math.max(document.lineCount - 1, 0));
  const startOffset = document.offsetAt(new vscode.Position(startLine, 0));
  const signatureOpen = findMethodSignatureOpen(text, startOffset, method.name);
  if (signatureOpen < 0) return document.lineAt(startLine).text;

  const signatureClose = findMatchingParen(text, signatureOpen);
  if (signatureClose < 0) return document.lineAt(startLine).text;

  const openBrace = findNextBrace(text, signatureClose + 1);
  if (openBrace < 0) return document.lineAt(startLine).text;

  const closeBrace = findMatchingBrace(text, openBrace);
  const endOffset = closeBrace >= 0 ? closeBrace + 1 : document.offsetAt(new vscode.Position(document.lineCount - 1, 0));
  return text.slice(startOffset, endOffset).trim();
}

function findMethodSignatureOpen(text: string, start: number, methodName: string): number {
  const re = new RegExp(`\\b${escapeRegex(methodName)}\\s*\\(`, 'g');
  re.lastIndex = start;
  const match = re.exec(text);
  return match ? text.indexOf('(', match.index) : -1;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferMainJavaRoot(httpPath: string): string | null {
  const normalized = normalizePath(httpPath);
  const marker = '/src/main/resources/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) return null;
  return normalized.slice(0, idx) + '/src/main/java/';
}

function scoreJavaCandidate(javaPath: string, httpPath: string, preferredRoot: string | null): number {
  const normalizedJava = normalizePath(javaPath);
  let score = httpPath.length - commonPrefixLength(normalizedJava, normalizePath(httpPath));
  if (preferredRoot && normalizedJava.startsWith(preferredRoot)) score -= 10000;
  return score;
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

function findNextBrace(text: string, start: number): number {
  let quote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '{') return i;
  }

  return -1;
}

function findMatchingParen(text: string, openParen: number): number {
  let depth = 0;
  let quote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openParen; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '(') depth++;
    if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findMatchingBrace(text: string, openBrace: number): number {
  let depth = 0;
  let quote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openBrace; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}
