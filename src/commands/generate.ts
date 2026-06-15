import * as vscode from 'vscode';
import * as path from 'path';
import { CodeLensArgs } from '../types';
import { resolveHttpFilePath } from '../util/workspace';
import { nextBlockName, requestBlockBaseName } from '../util/httpFile';
import { resolveBaseUrl } from '../util/springConfig';
import { DEFAULT_BASE_URL, renderBlock } from '../generator/httpFileGenerator';
import { DtoParser } from '../parser/dtoParser';

export function createGenerateCommand(dtoParser: DtoParser) {
  return async (args: CodeLensArgs) => {
    if (!args?.controller || !args?.method) {
      vscode.window.showErrorMessage('httpYacBuddy: invalid CodeLens arguments');
      return;
    }
    const { controller, method } = args;
    const httpPath = resolveHttpFilePath(controller.filePath, controller.className);
    const uri = vscode.Uri.file(httpPath);

    let existing = '';
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      existing = new TextDecoder('utf8').decode(bytes);
    } catch {
      existing = '';
    }

    const blockBaseName = requestBlockBaseName(controller, method);
    const blockName = nextBlockName(existing, blockBaseName);
    const baseUrl = await resolveBaseUrl(controller.filePath, DEFAULT_BASE_URL);
    const block = await renderBlock(controller, method, blockName, dtoParser, baseUrl);

    let next: string;
    if (!existing.trim()) {
      next = block.text + '\n';
    } else {
      const trimmed = existing.replace(/\s+$/, '');
      next = trimmed + '\n\n' + block.text + '\n';
    }

    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(httpPath)));
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(next));

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);
    const targetLine = findBlockLine(next, blockName);
    if (targetLine >= 0) {
      const pos = new vscode.Position(targetLine, 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
  };
}

function findBlockLine(content: string, blockName: string): number {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^###\\s+${escape(blockName)}\\s*$`))) return i;
  }
  return -1;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
