import * as path from 'path';
import * as vscode from 'vscode';
import { HttpCodeLensArgs } from '../httpCodeLensProvider';
import { RegexControllerParser } from '../parser/regexControllerParser';
import { extractBlockText, inferMethodNameFromBlock } from '../util/httpFile';
import { extractMethodSource, findControllerJavaFile } from '../util/javaController';
import { isChinese } from '../util/i18n';

export function createCopyAiPromptCommand(parser: RegexControllerParser) {
  return async (args: HttpCodeLensArgs) => {
    const zh = isChinese();

    if (!args?.httpPath || !args?.blockName) {
      vscode.window.showErrorMessage('Spring HTTP Buddy: invalid HTTP CodeLens arguments');
      return;
    }

    const httpDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(args.httpPath));
    const httpBlock = extractBlockText(httpDoc.getText(), args.blockName);
    if (!httpBlock) {
      vscode.window.showWarningMessage(
        zh ? `未找到 "${args.blockName}" 请求块` : `Request block "${args.blockName}" not found`
      );
      return;
    }

    const className = path.basename(args.httpPath, '.http');
    const javaUri = await findControllerJavaFile(args.httpPath, className);
    if (!javaUri) {
      vscode.window.showWarningMessage(zh ? `未找到 ${className}.java` : `${className}.java not found`);
      return;
    }

    const javaDoc = await vscode.workspace.openTextDocument(javaUri);
    const controller = parser.parse(javaDoc.getText(), javaUri.fsPath);
    const methodName = inferMethodNameFromBlock(args.blockName);
    const targetMethod = controller?.methods.find((method) => method.name === methodName);
    if (!targetMethod) {
      vscode.window.showWarningMessage(zh ? `未找到 "${methodName}" 方法` : `Method "${methodName}" not found`);
      return;
    }

    const methodSource = extractMethodSource(javaDoc, targetMethod);
    const prompt = buildPrompt(zh, httpBlock, methodSource, className, methodName);
    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage(
      zh ? 'AI 参数生成提示词已复制到剪贴板' : 'AI parameter prompt copied to clipboard'
    );
  };
}

function buildPrompt(
  zh: boolean,
  httpBlock: string,
  methodSource: string,
  className: string,
  methodName: string
): string {
  return zh
    ? buildChinesePrompt(httpBlock, methodSource, className, methodName)
    : buildEnglishPrompt(httpBlock, methodSource, className, methodName);
}

function buildEnglishPrompt(httpBlock: string, methodSource: string, className: string, methodName: string): string {
  return [
    'You are an API testing assistant familiar with Spring MVC and .http syntax (REST Client / httpYac / IntelliJ HTTP Client).',
    '',
    'Based on the Java controller method and the current .http request block below, generate more realistic, business-meaningful sample values for the request params, path variables, query params, form params, headers and JSON body.',
    '',
    'Requirements:',
    '- Return only the updated .http request block, with no explanation.',
    '- Keep the HTTP method, URL path, parameter names, header names and JSON field names unchanged.',
    '- You may replace placeholder values such as aa, username, 0, 1, false, 2026-01-01.',
    '- For fields like email, phone, address, name, title, date, amount and id, generate reasonable test data.',
    '- Do not use real personal data, real tokens, real passwords or production URLs; use obviously fake values for passwords/tokens.',
    '- If the semantics cannot be inferred from the code, use concise, safe, readable sample values.',
    '',
    `Controller: ${className}`,
    `Method: ${methodName}`,
    '',
    'Java controller method:',
    '```java',
    methodSource,
    '```',
    '',
    'Current .http request block:',
    '```http',
    httpBlock,
    '```',
  ].join('\n');
}

function buildChinesePrompt(httpBlock: string, methodSource: string, className: string, methodName: string): string {
  return [
    '你是一个熟悉 Spring MVC 和 .http (REST Client / httpYac / IntelliJ HTTP Client) 语法的接口测试助手。',
    '',
    '请根据下面的 Java Controller 方法和当前 .http 请求块，为请求参数、路径变量、query 参数、form 参数、header 和 JSON body 生成更真实、更有业务含义的示例值。',
    '',
    '要求：',
    '- 只返回更新后的 .http 请求块，不要解释。',
    '- 保持 HTTP method、URL path、参数名、header 名和 JSON 字段名不变。',
    '- 可以替换占位值，例如 aa、username、0、1、false、2026-01-01。',
    '- email、phone、address、name、title、date、amount、id 等字段请生成合理的测试数据。',
    '- 不要使用真实个人隐私、真实 token、真实密码或生产环境地址；密码/token 使用明显的 fake 值。',
    '- 如果无法从代码推断语义，使用简洁、安全、可读的示例值。',
    '',
    `Controller: ${className}`,
    `Method: ${methodName}`,
    '',
    'Java Controller 方法：',
    '```java',
    methodSource,
    '```',
    '',
    '当前 .http 请求块：',
    '```http',
    httpBlock,
    '```',
  ].join('\n');
}
