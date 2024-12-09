import { ExtensionContext, workspace, window, commands } from 'vscode';
import { generateOutputCommand } from './commands/generateOutput';
import { FileExplorerProvider } from './providers/fileExplorerProvider';
import { SecretsPanel } from './SecretsPanel';

export function activate(context: ExtensionContext) {
    const workspaceFolders = workspace.workspaceFolders;
    const rootPath = workspaceFolders ? workspaceFolders[0].uri.fsPath : '';
    const fileExplorerProvider = new FileExplorerProvider(rootPath);

    const treeView = window.createTreeView('codeStarterExplorer', {
        treeDataProvider: fileExplorerProvider,
        canSelectMany: true,
    });

    commands.registerCommand('fileExplorer.generateOutput', () =>
        generateOutputCommand(treeView, rootPath, context)
    );

    context.subscriptions.push(
        commands.registerCommand('secretsManager.openSecretsPanel', () => {
            SecretsPanel.createOrShow(context);
        })
    );

    commands.registerCommand('fileExplorer.refresh', () => fileExplorerProvider.refresh());
}

export function deactivate() {}