import * as vscode from 'vscode';
import { CodeLensArgs } from '../types';
import { resolveHttpFilePath } from '../util/workspace';
import { listMatchingBlocks } from '../util/httpFile';

export function createOpenCommand() {
  return async (args: CodeLensArgs) => {
    if (!args?.controller || !args?.method) {
      vscode.window.showErrorMessage('httpYacBuddy: invalid CodeLens arguments');
      return;
    }
    const { controller, method } = args;
    const httpPath = resolveHttpFilePath(controller.filePath, controller.className);
    const uri = vscode.Uri.file(httpPath);

    let content: string;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      content = new TextDecoder('utf8').decode(bytes);
    } catch {
      vscode.window.showWarningMessage(`未找到 ${controller.className}.http，请先 Generate HTTP Request`);
      return;
    }

    const blocks = listMatchingBlocks(content, method.name);
    if (blocks.length === 0) {
      vscode.window.showWarningMessage(`${controller.className}.http 中未找到 "${method.name}" 的请求块，请先 Generate`);
      return;
    }

    let target = blocks[0];
    if (blocks.length > 1) {
      const picked = await vscode.window.showQuickPick(
        blocks.map((b) => ({
          label: b.name,
          description: `line ${b.line + 1}`,
          block: b,
        })),
        { placeHolder: `选择要打开的 ${method.name} 请求块` }
      );
      if (!picked) return;
      target = picked.block;
    }

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(target.line, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
  };
}
