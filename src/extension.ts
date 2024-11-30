import * as vscode from 'vscode';
import { FileExplorerProvider } from './providers/fileExplorerProvider';
import { generateOutputCommand } from './commands/generateOutput';
import { SecretsPanel } from './SecretsPanel';

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders ? workspaceFolders[0].uri.fsPath : '';
    const fileExplorerProvider = new FileExplorerProvider(rootPath);

    const treeView = vscode.window.createTreeView('codeStarterExplorer', {
        treeDataProvider: fileExplorerProvider,
        canSelectMany: true,
    });

    vscode.commands.registerCommand('fileExplorer.generateOutput', () =>
        generateOutputCommand(treeView, rootPath, context)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('secretsManager.openSecretsPanel', () => {
          SecretsPanel.createOrShow(context);
        })
    );

    vscode.commands.registerCommand('fileExplorer.refresh', () => fileExplorerProvider.refresh());
    
}

export function deactivate() {}