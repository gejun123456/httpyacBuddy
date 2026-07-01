import * as vscode from 'vscode';
import { messages, type MessageKey } from '../i18n/messages';

/** Whether the VS Code UI language is Chinese (zh-cn / zh-tw / …). */
export function isChinese(): boolean {
  return vscode.env.language.toLowerCase().startsWith('zh');
}

/** Look up a message key and return the appropriate language version. */
export function t(key: MessageKey, params?: Record<string, string>): string {
  const msg = messages[key];
  let text: string = isChinese() ? msg.zh : msg.en;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return text;
}
