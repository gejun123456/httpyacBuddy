import * as path from 'path';
import * as vscode from 'vscode';
import { HttpCodeLensArgs } from '../httpCodeLensProvider';
import { RegexControllerParser } from '../parser/regexControllerParser';
import { inferMethodNameFromBlock } from '../util/httpFile';

export function createOpenControllerCommand(parser: RegexControllerParser) {
  return async (args: HttpCodeLensArgs) => {
    if (!args?.httpPath || !args?.blockName) {
      vscode.window.showErrorMessage('httpYacBuddy: invalid HTTP CodeLens arguments');
      return;
    }

    const className = path.basename(args.httpPath, '.http');
    const javaUri = await findControllerJavaFile(args.httpPath, className);
    if (!javaUri) {
      vscode.window.showWarningMessage(`未找到 ${className}.java`);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(javaUri);
    const controller = parser.parse(doc.getText(), javaUri.fsPath);
    const methodName = inferMethodNameFromBlock(args.blockName);
    const targetMethod = controller?.methods.find((method) => method.name === methodName);

    const editor = await vscode.window.showTextDocument(doc);
    const line = targetMethod?.annotationLine ?? controller?.classLine ?? 0;
    const pos = new vscode.Position(Math.min(line, Math.max(doc.lineCount - 1, 0)), 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);

    if (!targetMethod) {
      vscode.window.showWarningMessage(`已打开 ${className}.java，但未找到 "${methodName}" 方法`);
    }
  };
}

async function findControllerJavaFile(httpPath: string, className: string): Promise<vscode.Uri | null> {
  const matches = await vscode.workspace.findFiles(`**/${className}.java`, '**/{node_modules,target,build,out,dist,.git}/**');
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const preferredRoot = inferMainJavaRoot(httpPath);
  const ranked = matches
    .map((uri) => ({ uri, score: scoreJavaCandidate(uri.fsPath, httpPath, preferredRoot) }))
    .sort((a, b) => a.score - b.score);

  return ranked[0].uri;
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
