import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileItem } from '../models/fileItem';

export class FileExplorerProvider implements vscode.TreeDataProvider<FileItem> {
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
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
    }
}