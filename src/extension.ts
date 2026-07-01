import * as vscode from 'vscode';
import { RegexControllerParser } from './parser/regexControllerParser';
import { DtoParser } from './parser/dtoParser';
import { JavaControllerCodeLensProvider } from './codeLensProvider';
import { HttpFileCodeLensProvider } from './httpCodeLensProvider';
import { createGenerateCommand } from './commands/generate';
import { createOpenCommand } from './commands/open';
import { createOpenControllerCommand } from './commands/openController';
import { createCopyAiPromptCommand } from './commands/copyAiPrompt';

const HTTPYAC_EXTENSION_ID = 'anweber.vscode-httpyac';
const HTTPYAC_PROMPTED_KEY = 'httpyacPrompted';

function promptHttpYacInstall(context: vscode.ExtensionContext): void {
  if (context.globalState.get<boolean>(HTTPYAC_PROMPTED_KEY)) return;
  if (vscode.extensions.getExtension(HTTPYAC_EXTENSION_ID)) return;

  context.globalState.update(HTTPYAC_PROMPTED_KEY, true);

  vscode.window
    .showInformationMessage(
      '推荐安装 httpYac 插件来运行 .http 文件，它对 .http 格式的支持最好（环境变量、断言、响应处理等）。',
      '安装 httpYac',
      '不再提示',
    )
    .then((choice) => {
      if (choice === '安装 httpYac') {
        vscode.commands.executeCommand('workbench.extensions.installExtension', HTTPYAC_EXTENSION_ID);
      }
    });
}

export function activate(context: vscode.ExtensionContext): void {
  promptHttpYacInstall(context);

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
    vscode.commands.registerCommand('springHttpBuddy.generate', createGenerateCommand(dtoParser)),
    vscode.commands.registerCommand('springHttpBuddy.open', createOpenCommand()),
    vscode.commands.registerCommand('springHttpBuddy.openController', createOpenControllerCommand(parser)),
    vscode.commands.registerCommand('springHttpBuddy.copyAiPrompt', createCopyAiPromptCommand(parser)),
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
