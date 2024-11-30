import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as vscode from 'vscode';

export class CodeGenerator {
    private async getToken(clientID: string, clientSecret: string, grantType: string): Promise<string> {
        try {
            const response = await axios.post('https://idm.stackspot.com/zup/oidc/oauth/token', {
                client_id: clientID,
                grant_type: grantType,
                client_secret: clientSecret
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return response.data.access_token;
        } catch (error: any) {
            throw new Error(`Failed to get token: ${error.message}`, { cause: error });
        }
    }

    private async startExecution(quickCommand: string, token: string, inputData: string): Promise<string> {
        try {
            const response = await axios.post(`https://genai-code-buddy-api.stackspot.com/v1/quick-commands/create-execution/${quickCommand}`, {
                input_data: inputData
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to start execution: ${error.message}`, { cause: error });
        }
    }

    private async checkStatus(token: string, executionID: string): Promise<any> {
        try {
            const response = await axios.get(`https://genai-code-buddy-api.stackspot.com/v1/quick-commands/callback/${executionID}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to check status: ${error.message}`, { cause: error });
        }
    }

    private extractFileName(content: string): string {
        const reClass = /^(?:public\s+)?(class|interface)\s+(\w+)/m;
        const matches = reClass.exec(content);
        if (!matches || matches.length < 3) {
            throw new Error("Class or interface declaration not found");
        }
        return `${matches[2]}.java`;
    }

    private async saveFile(rootPath: string, packagePath: string, fileName: string, content: string): Promise<void> {
        // Define o diretório base como o diretório raiz do projeto
        const baseDir = path.join(rootPath, 'output');
    
        // Constrói o caminho do diretório de saída, substituindo '.' por separadores de diretório
        const dirPath = path.join(baseDir, packagePath.replace(/\./g, path.sep));
        
        // Cria o diretório de forma recursiva, caso ele não exista
        await fs.promises.mkdir(dirPath, { recursive: true });
        
        // Constrói o caminho completo do arquivo
        const pathFIle = path.join(dirPath, fileName);
        
        // Escreve o conteúdo no arquivo, criando-o ou sobrescrevendo-o, se já existir
        await fs.promises.writeFile(pathFIle, content, 'utf8');
    }

    private async processSteps(rootPath: string, steps: any): Promise<void> {
        for (const step of steps) {
            const re = /```java([\s\S]*?)```/g;
            const matches = step.step_result.answer.matchAll(re);
            for (const match of matches) {
                const codeBlock = match[1].trim();
                const lines = codeBlock.split('\n');
                const packageLine = lines[0].trim();
                const content = lines.slice(1).join('\n');
                if (packageLine.startsWith("package")) {
                    const packagePath = packageLine.split(' ')[1].replace(';', '');
                    const fileName = this.extractFileName(content);
                    await this.saveFile(rootPath, packagePath, fileName, packageLine + '\n' + content);
                }
            }
        }
    }

    public async executeGeneration(quickCommand: string, inputData: string, rootPath: string, clientID: string, clientSecret: string, grantType: string): Promise<string> {
        try {
            const token = await this.getToken(clientID, clientSecret, grantType);
            const executionID = await this.startExecution(quickCommand, token, inputData);

            let result;
            while (true) {
                try {
                    result = await this.checkStatus(token, executionID);
                } catch (error) {
                    console.error('Error checking status:', error);
                    throw error;
                }
                if (result.progress.status === 'COMPLETED' || result.progress.status === 'FAILURE') {
                    break;
                }
                vscode.window.showInformationMessage(`Execution progress: ${result.progress.execution_percentage * 100}%`);
                console.log(`Execution progress: ${result.progress.execution_percentage * 100}%`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
            }

            if (result.progress.status !== 'FAILURE') {
                try {
                    await this.processSteps(rootPath, result.steps);
                } catch (error) {
                    console.error('Error processing steps:', error);
                    throw error;
                }
                return 'Files saved successfully!';
            } else {
                return 'Execution failed!';
            }
        } catch (error: any) {
            console.error(`Error during execution: ${error.message}`, { cause: error });
        }
        return 'Execution failed!';
    }
}

