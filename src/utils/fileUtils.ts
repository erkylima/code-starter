import { CodeGenerator } from '../generators/execution';
import * as vscode from 'vscode';

export async function getCommandForAction(
    action: string,
    rootPath: string,
    content: string,
    context: vscode.ExtensionContext
): Promise<string> {
    switch (action) {
        case 'Testfy':
            const userInput = await vscode.window.showInputBox({
                placeHolder: 'Quais camadas da aplicação você quer gerar testes?',
                prompt: 'Essa informação será usada no processamento do QuickCommand',
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        throw new Error('A informação não pode estar vazia.');
                    }
                    return null;
                },
            });

            const secretStorage = context.secrets;

            if (!secretStorage) {
                throw new Error('Sem Secrets Iniciadas.');
            }

            const clientId = await secretStorage.get('clientId');
            const clientSecret = await secretStorage.get('clientSecret');
            const grantType = await secretStorage.get('grantType');
            const generator = new CodeGenerator();

            if (!clientId || !clientSecret || !grantType) {
                throw new Error('Parâmetros obrigatórios ausentes.');
            }

            try {
                return await generator.executeGeneration('testfy', content, rootPath, clientId, clientSecret, grantType);
            } catch (err: any){
                throw err;
            }
             

        default:
            throw new Error('Ação desconhecida');
    }
}