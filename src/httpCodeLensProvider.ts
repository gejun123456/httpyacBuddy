import * as vscode from 'vscode';
import { listAllBlocks } from './util/httpFile';

export interface HttpCodeLensArgs {
  httpPath: string;
  blockName: string;
}

export class HttpFileCodeLensProvider implements vscode.CodeLensProvider {
  private changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.changeEmitter.event;

  refresh(): void {
    this.changeEmitter.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (!document.uri.fsPath.endsWith('.http')) return [];

    return listAllBlocks(document.getText()).flatMap((block) => {
      const range = new vscode.Range(block.line, 0, block.line, 0);
      const args: HttpCodeLensArgs = { httpPath: document.uri.fsPath, blockName: block.name };
      return [
        new vscode.CodeLens(range, {
          title: '$(go-to-file) Open Java Controller',
          command: 'httpYacBuddy.openController',
          arguments: [args],
        }),
        new vscode.CodeLens(range, {
          title: '$(sparkle) Copy AI Parameter Prompt',
          command: 'httpYacBuddy.copyAiPrompt',
          arguments: [args],
        }),
      ];
    });
  }
}
