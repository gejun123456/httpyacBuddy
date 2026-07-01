import * as vscode from 'vscode';
import { CodeLensArgs } from '../types';
import { resolveHttpFilePath } from '../util/workspace';
import { listMatchingBlocks, requestBlockBaseName } from '../util/httpFile';
import { t } from '../util/i18n';

export function createOpenCommand() {
  return async (args: CodeLensArgs) => {
    if (!args?.controller || !args?.method) {
      vscode.window.showErrorMessage('Spring HTTP Buddy: invalid CodeLens arguments');
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
      const genLabel = t('open.generateAction');
      const picked = await vscode.window.showWarningMessage(
        t('open.notFound', { className: controller.className }),
        genLabel
      );
      if (picked === genLabel) await vscode.commands.executeCommand('springHttpBuddy.generate', args);
      return;
    }

    const blockBaseName = requestBlockBaseName(controller, method);
    let blocks = listMatchingBlocks(content, blockBaseName);
    if (blocks.length === 0 && blockBaseName !== method.name) {
      blocks = listMatchingBlocks(content, method.name);
    }
    if (blocks.length === 0) {
      const genLabel = t('open.generateAction');
      const picked = await vscode.window.showWarningMessage(
        t('open.blockNotFound', { blockName: blockBaseName, className: controller.className }),
        genLabel
      );
      if (picked === genLabel) await vscode.commands.executeCommand('springHttpBuddy.generate', args);
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
        { placeHolder: t('open.selectBlock', { methodName: method.name }) }
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
