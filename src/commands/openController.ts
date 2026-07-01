import * as vscode from 'vscode';
import { HttpCodeLensArgs } from '../httpCodeLensProvider';
import { RegexControllerParser } from '../parser/regexControllerParser';
import { findControllerJavaFile } from '../util/javaController';
import { inferMethodNameFromBlock } from '../util/httpFile';
import { t } from '../util/i18n';

export function createOpenControllerCommand(parser: RegexControllerParser) {
  return async (args: HttpCodeLensArgs) => {
    if (!args?.httpPath || !args?.blockName) {
      vscode.window.showErrorMessage('Spring HTTP Buddy: invalid HTTP CodeLens arguments');
      return;
    }

    const className = args.httpPath.replace(/^.*[\\/]/, '').replace(/\.http$/, '');
    const javaUri = await findControllerJavaFile(args.httpPath, className);
    if (!javaUri) {
      vscode.window.showWarningMessage(t('openController.javaNotFound', { className }));
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
      vscode.window.showWarningMessage(
        t('openController.methodNotFound', { className, methodName })
      );
    }
  };
}
