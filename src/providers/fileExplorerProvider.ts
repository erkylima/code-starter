import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window } from 'vscode';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { FileItem } from '../models/fileItem';

export class FileExplorerProvider implements TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: EventEmitter<FileItem | undefined | void> = new EventEmitter<
        FileItem | undefined | void
    >();
    readonly onDidChangeTreeData: Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem): TreeItem {
        return element;
    }

    async getChildren(element?: FileItem): Promise<FileItem[]> {
        if (!this.workspaceRoot) {
            window.showInformationMessage('Nenhum workspace encontrado');
            return [];
        }

        const dirPath = element ? element.uri.fsPath : this.workspaceRoot;
        const files = await this.readDirectory(dirPath);

        return files.map((file) => {
            const filePath = join(dirPath, file.name);
            const collapsibleState = file.isDirectory
                ? TreeItemCollapsibleState.Collapsed
                : TreeItemCollapsibleState.None;

            return new FileItem(Uri.file(filePath), collapsibleState);
        });
    }

    private async readDirectory(dir: string): Promise<{ name: string; isDirectory: boolean }[]> {
        const items = readdirSync(dir).map((name) => {
            const filePath = join(dir, name);
            return { name, isDirectory: statSync(filePath).isDirectory() };
        });

        return items.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
    }
}