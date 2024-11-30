import * as vscode from 'vscode';
import * as path from 'path';

export class FileItem extends vscode.TreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(path.basename(uri.fsPath), collapsibleState);
        this.tooltip = uri.fsPath;
        this.description = undefined;
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.iconPath = new vscode.ThemeIcon("file"); // Ícone para arquivos
        } else {
            this.iconPath = new vscode.ThemeIcon("folder"); // Ícone para diretórios
        }
    }
}