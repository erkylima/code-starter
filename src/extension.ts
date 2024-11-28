import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

/** Classe para representar os itens da TreeView */
class FileItem extends vscode.TreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(path.basename(uri.fsPath), collapsibleState);
        this.tooltip = uri.fsPath;
        this.description = collapsibleState === vscode.TreeItemCollapsibleState.None ? '' : path.basename(uri.fsPath);
    }
}

/** Classe para fornecer os dados da TreeView */
class FileExplorerProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<
        FileItem | undefined | void
    >();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FileItem): Promise<FileItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('Nenhum workspace encontrado');
            return [];
        }

        const dirPath = element ? element.uri.fsPath : this.workspaceRoot;
        const files = await this.readDirectory(dirPath);

        return files.map((file) => {
            const filePath = path.join(dirPath, file.name);
            const collapsibleState = file.isDirectory
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None;

            return new FileItem(vscode.Uri.file(filePath), collapsibleState);
        });
    }

    private async readDirectory(dir: string): Promise<{ name: string; isDirectory: boolean }[]> {
        const items = fs.readdirSync(dir).map((name) => {
            const filePath = path.join(dir, name);
            return { name, isDirectory: fs.statSync(filePath).isDirectory() };
        });

        return items.sort((a, b) => {
            // Ordena diretórios antes de arquivos
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
    }
}

/** Ativa a extensão. */
export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders ? workspaceFolders[0].uri.fsPath : '';
    const fileExplorerProvider = new FileExplorerProvider(rootPath);

    const treeView = vscode.window.createTreeView('customFileExplorer', {
        treeDataProvider: fileExplorerProvider,
        canSelectMany: true, // Habilita a seleção múltipla nativa
    });

    // Comando para gerar saída combinada dos arquivos selecionados
	vscode.commands.registerCommand('fileExplorer.generateOutput', async () => {
		const selectedItems = treeView.selection; // Obtém os itens selecionados diretamente da TreeView
		if (selectedItems.length === 0) {
			vscode.window.showWarningMessage('Nenhum arquivo ou pasta selecionado!');
			return;
		}

		const action = await vscode.window.showQuickPick(
			['Testfy', 'Crudify', 'Crufidy Gateway'],
			{
				placeHolder: 'Escolha a ação que deseja realizar com os arquivos selecionados',
			}
		);
	
		if (!action) {
			vscode.window.showInformationMessage('Nenhuma ação selecionada.');
			return;
		}
	
		let combinedContent = '';
	
		for (const item of selectedItems) {
			try {
				const stats = fs.statSync(item.uri.fsPath);
	
				if (stats.isDirectory()) {
					// Se for uma pasta, lê todos os arquivos dentro dela
					const files = fs.readdirSync(item.uri.fsPath);
					for (const file of files) {
						const filePath = path.join(item.uri.fsPath, file);
						const fileStats = fs.statSync(filePath);
	
						if (fileStats.isFile()) {
							const content = fs.readFileSync(filePath, 'utf-8');
							combinedContent += `\n\n--- File: ${path.basename(filePath)} ---\n\n${content}`;
						}
					}
				} else if (stats.isFile()) {
					// Se for um arquivo, adiciona diretamente
					const content = fs.readFileSync(item.uri.fsPath, 'utf-8');
					combinedContent += `\n\n--- File: ${path.basename(item.uri.fsPath)} ---\n\n${content}`;
				}
			} catch (err) {
				vscode.window.showErrorMessage(`Erro ao processar: ${item.uri.fsPath}`);
			}
		}
	
		const outputFilePath = path.join(rootPath, 'combined_output.txt');
		fs.writeFileSync(outputFilePath, combinedContent, 'utf-8');
		vscode.window.showInformationMessage(`Arquivo combinado criado: ${outputFilePath}`);
		// Executa o programa no CMD com o arquivo combinado como argumento
		const command = await getCommandForAction(action, combinedContent);
		exec(command, (error, stdout, stderr) => {
			if (error) {
				vscode.window.showErrorMessage(`Erro ao executar o comando: ${error.message}`);
				return;
			}
			if (stderr) {
				vscode.window.showWarningMessage(`Aviso: ${stderr}`);
			}
			vscode.window.showInformationMessage(`Comando executado com sucesso: ${stdout}`);
		});
	});

    vscode.commands.registerCommand('fileExplorer.refresh', () => fileExplorerProvider.refresh());
}

async function getCommandForAction(action: string, content: string): Promise<string> {
    switch (action) {
        case 'Testfy':
			const userInput = await vscode.window.showInputBox({
				placeHolder: 'Quais camadas da aplicação você quer gerar testes?',
				prompt: 'Essa informação será usada no processamento do QuickCommand',
				validateInput: (value) => {
					if (!value || value.trim() === '') {
						return 'A informação não pode estar vazia.';
					}
					return null;
				},
			});
	
			// Use userInput here
			console.log(userInput);
		
            return `cmd /c testfy \n${userInput + content}`;
        case 'Crudify':
            return `cmd /c crudify ${content}`;
        case 'Crudify Gateway':
            return `cmd /c crudify-gateway ${content}`;
        default:
            throw new Error('Ação desconhecida');
    }
}

/** Desativa a extensão. */
export function deactivate() {}