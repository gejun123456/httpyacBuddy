import * as vscode from 'vscode';
import { RegexControllerParser } from './parser/regexControllerParser';
import { DtoParser } from './parser/dtoParser';
import { JavaControllerCodeLensProvider } from './codeLensProvider';
import { createGenerateCommand } from './commands/generate';
import { createOpenCommand } from './commands/open';

export function activate(context: vscode.ExtensionContext): void {
  const parser = new RegexControllerParser();
  const dtoParser = new DtoParser();
  const codeLensProvider = new JavaControllerCodeLensProvider(parser);

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ language: 'java', scheme: 'file' }, codeLensProvider),
    vscode.commands.registerCommand('httpYacBuddy.generate', createGenerateCommand(dtoParser)),
    vscode.commands.registerCommand('httpYacBuddy.open', createOpenCommand()),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId === 'java') codeLensProvider.refresh();
    })
  );
}

export function deactivate(): void {
  // no-op
}
