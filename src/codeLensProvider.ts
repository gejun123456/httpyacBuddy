import * as vscode from 'vscode';
import { ControllerParser } from './parser/controllerParser';
import { CodeLensArgs } from './types';

export class JavaControllerCodeLensProvider implements vscode.CodeLensProvider {
  private changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.changeEmitter.event;

  constructor(private parser: ControllerParser) {}

  refresh(): void {
    this.changeEmitter.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const controller = this.parser.parse(document.getText(), document.uri.fsPath);
    if (!controller) return [];

    const lenses: vscode.CodeLens[] = [];
    for (const method of controller.methods) {
      const range = new vscode.Range(method.annotationLine, 0, method.annotationLine, 0);
      const args: CodeLensArgs = { controller, method };
      lenses.push(
        new vscode.CodeLens(range, {
          title: `$(rocket) Generate ${method.httpMethod} Request`,
          command: 'springHttpBuddy.generate',
          arguments: [args],
        })
      );
      lenses.push(
        new vscode.CodeLens(range, {
          title: `$(go-to-file) Open ${method.httpMethod} Request`,
          command: 'springHttpBuddy.open',
          arguments: [args],
        })
      );
    }
    return lenses;
  }
}
