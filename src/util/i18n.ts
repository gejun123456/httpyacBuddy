import * as vscode from 'vscode';

/**
 * Whether the VS Code UI language is Chinese (zh-cn / zh-tw / …).
 * User-facing strings default to English and switch to Chinese only when this is true.
 */
export function isChinese(): boolean {
  return vscode.env.language.toLowerCase().startsWith('zh');
}

/** Pick `zh` when the UI is Chinese, otherwise `en`. */
export function t(en: string, zh: string): string {
  return isChinese() ? zh : en;
}
