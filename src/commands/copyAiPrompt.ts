import * as path from 'path';
import * as vscode from 'vscode';
import { HttpCodeLensArgs } from '../httpCodeLensProvider';
import { RegexControllerParser } from '../parser/regexControllerParser';
import { extractBlockText, inferMethodNameFromBlock } from '../util/httpFile';
import { extractMethodSource, findControllerJavaFile } from '../util/javaController';

export function createCopyAiPromptCommand(parser: RegexControllerParser) {
  return async (args: HttpCodeLensArgs) => {
    if (!args?.httpPath || !args?.blockName) {
      vscode.window.showErrorMessage('httpYacBuddy: invalid HTTP CodeLens arguments');
      return;
    }

    const httpDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(args.httpPath));
    const httpBlock = extractBlockText(httpDoc.getText(), args.blockName);
    if (!httpBlock) {
      vscode.window.showWarningMessage(`未找到 "${args.blockName}" 请求块`);
      return;
    }

    const className = path.basename(args.httpPath, '.http');
    const javaUri = await findControllerJavaFile(args.httpPath, className);
    if (!javaUri) {
      vscode.window.showWarningMessage(`未找到 ${className}.java`);
      return;
    }

    const javaDoc = await vscode.workspace.openTextDocument(javaUri);
    const controller = parser.parse(javaDoc.getText(), javaUri.fsPath);
    const methodName = inferMethodNameFromBlock(args.blockName);
    const targetMethod = controller?.methods.find((method) => method.name === methodName);
    if (!targetMethod) {
      vscode.window.showWarningMessage(`未找到 "${methodName}" 方法`);
      return;
    }

    const methodSource = extractMethodSource(javaDoc, targetMethod);
    const prompt = buildPrompt(httpBlock, methodSource, className, methodName);
    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage('AI 参数生成提示词已复制到剪贴板');
  };
}

function buildPrompt(httpBlock: string, methodSource: string, className: string, methodName: string): string {
  return [
    '你是一个熟悉 Spring MVC 和 httpYac 语法的接口测试助手。',
    '',
    '请根据下面的 Java Controller 方法和当前 httpYac 请求块，为请求参数、路径变量、query 参数、form 参数、header 和 JSON body 生成更真实、更有业务含义的示例值。',
    '',
    '要求：',
    '- 只返回更新后的 httpYac 请求块，不要解释。',
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
    '当前 httpYac 请求块：',
    '```http',
    httpBlock,
    '```',
  ].join('\n');
}
