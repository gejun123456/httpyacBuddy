import * as vscode from 'vscode';
import { RegexControllerParser } from './parser/regexControllerParser';
import { DtoParser } from './parser/dtoParser';
import { JavaControllerCodeLensProvider } from './codeLensProvider';
import { HttpFileCodeLensProvider } from './httpCodeLensProvider';
import { createGenerateCommand } from './commands/generate';
import { createOpenCommand } from './commands/open';
import { createOpenControllerCommand } from './commands/openController';
import { createCopyAiPromptCommand } from './commands/copyAiPrompt';

export function activate(context: vscode.ExtensionContext): void {
  const parser = new RegexControllerParser();
  const dtoParser = new DtoParser();
  const codeLensProvider = new JavaControllerCodeLensProvider(parser);
  const httpCodeLensProvider = new HttpFileCodeLensProvider();
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;

  const scheduleCodeLensRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      codeLensProvider.refresh();
      httpCodeLensProvider.refresh();
    }, 300);
  };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ language: 'java', scheme: 'file' }, codeLensProvider),
    vscode.languages.registerCodeLensProvider({ scheme: 'file', pattern: '**/*.http' }, httpCodeLensProvider),
    vscode.commands.registerCommand('httpYacBuddy.generate', createGenerateCommand(dtoParser)),
    vscode.commands.registerCommand('httpYacBuddy.open', createOpenCommand()),
    vscode.commands.registerCommand('httpYacBuddy.openController', createOpenControllerCommand(parser)),
    vscode.commands.registerCommand('httpYacBuddy.copyAiPrompt', createCopyAiPromptCommand(parser)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'java' || event.document.uri.fsPath.endsWith('.http')) scheduleCodeLensRefresh();
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId === 'java') {
        dtoParser.clearCache();
        codeLensProvider.refresh();
      }
      if (doc.uri.fsPath.endsWith('.http')) httpCodeLensProvider.refresh();
    }),
    { dispose: () => refreshTimer && clearTimeout(refreshTimer) }
  );
}

export function deactivate(): void {
  // no-op
}
