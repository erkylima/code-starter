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
            return `Failed to start execution: ${error.message}`;
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
        try {
            const baseDir = path.join(rootPath, 'output');
        
            const dirPath = path.join(baseDir, packagePath.replace(/\./g, path.sep));
            
            await fs.promises.mkdir(dirPath, { recursive: true });

            const pathFIle = path.join(dirPath, fileName);
            
            await fs.promises.writeFile(pathFIle, content, 'utf8');
        } catch (error: any) {
            throw new Error(`Failed to save file: ${error.message}`, { cause: error });
        }
    }

    private async processSteps(rootPath: string, steps: any): Promise<void> {
        try {

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
        } catch (error: any) {
            throw new Error(`Error during execution: ${error.message}`, { cause: error });

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
                } catch (error:any) {
                    throw new Error(`Error checking status: ${error.message}`, { cause: error });
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
                } catch (error: any) {
                    throw new Error(`Error processing steps: ${error.message}`, { cause: error });
                }
                return 'Files saved successfully!';
            } else {
                throw new Error('Execution failed! Token Excedido');
            }
        } catch (error: any) {
            throw new Error('Execution failed! Token Excedido');
        }
    }
}

