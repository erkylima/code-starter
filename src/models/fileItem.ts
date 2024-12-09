import { Command, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { basename } from 'path';

export class FileItem extends TreeItem {
    constructor(
        public readonly uri: Uri,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(basename(uri.fsPath), collapsibleState);
        this.tooltip = uri.fsPath;
        this.description = undefined;
        if (collapsibleState === TreeItemCollapsibleState.None) {
            this.iconPath = new ThemeIcon("file"); // Ícone para arquivos
        } else {
            this.iconPath = new ThemeIcon("folder"); // Ícone para diretórios
        }
    }
}