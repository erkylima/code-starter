import { CodeGenerator } from '../generators/execution';
import { ExtensionContext, window } from 'vscode';
import * as path from 'path';
export async function getCommandForAction(
    action: string,
    rootPath: string,
    content: string,
    context: ExtensionContext
): Promise<string> {
    const secretStorage = context.secrets;

    if (!secretStorage) {
        throw new Error('Sem Secrets Iniciadas.');
    }

    const clientId = await secretStorage.get('clientId');
    const clientSecret = await secretStorage.get('clientSecret');
    const grantType = await secretStorage.get('grantType');
    const tenant = await secretStorage.get('tenant');
    const generator = new CodeGenerator();

    if (!clientId || !clientSecret || !grantType || !tenant) {
        throw new Error('Parâmetros obrigatórios ausentes.');
    }

    switch (action) {
        case 'Testfy':
            const testfyInput = await window.showInputBox({
                placeHolder: 'Quais camadas da aplicação você quer gerar testes?',
                prompt: 'Essa informação será usada no processamento do CodeStarter',
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        throw new Error('A informação não pode estar vazia.');
                    }
                    return null;
                },
            });
            

            try {
                return await generator.executeGeneration('testfy', "Teste apenas: " + testfyInput +" do seguinte:"+ content, rootPath+path.sep+"testfy", clientId, clientSecret, grantType, tenant);
            } catch (err: any){
                throw err;
            }
             
        case 'Crudify':
            const crudifyInput = await window.showInputBox({
                placeHolder: 'Insira as DDLs que do projeto',
                prompt: 'Essa informação será usada no processamento do CodeStarter',
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        throw new Error('A informação não pode estar vazia.');
                    }
                    return null;
                },
            });
            

            try {
                return await generator.executeGeneration('crudify-3', "gere crud com  a seguinte DDL " + crudifyInput + content ? "use o seguinte conteudo para mergear: " +content : '', rootPath+path.sep+"testfy", clientId, clientSecret, grantType, tenant);
            } catch (err: any){
                throw err;
            }
        case 'Crufidy Gateway':
            throw new Error('Crudify Gateway Desabilitado.');
        default:
            throw new Error('Ação desconhecida');
    }
}