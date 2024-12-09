import { ExtensionContext, TreeView, Uri, window } from 'vscode';
import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, join } from 'path';
import { getCommandForAction } from '../utils/fileUtils';
import { FileItem } from '../models/fileItem';

export async function generateOutputCommand(
    treeView: TreeView<FileItem>,
    rootPath: string,
    context: ExtensionContext
) {
    const selectedItems = treeView.selection;


    const action = await window.showQuickPick(['Testfy', 'Crudify', 'Crufidy Gateway'], {
        placeHolder: 'Escolha a ação que deseja realizar com os arquivos selecionados', 
    });

    if (!action) {
        window.showInformationMessage('Nenhuma ação selecionada.');
        return;
    }

    let combinedContent = '';

    for (const item of selectedItems) {
        try {
            const stats = statSync(item.uri.fsPath);

            if (stats.isDirectory()) {
                const files = readdirSync(item.uri.fsPath);
                for (const file of files) {
                    const filePath = join(item.uri.fsPath, file);
                    const fileStats = statSync(filePath);

                    if (fileStats.isFile()) {
                        const content = readFileSync(filePath, 'utf-8');
                        combinedContent += `\n\n--- File: ${basename(filePath)} ---\n\n${content}`;
                    }
                }
            } else if (stats.isFile()) {
                const content = readFileSync(item.uri.fsPath, 'utf-8');
                combinedContent += `\n\n--- File: ${basename(item.uri.fsPath)} ---\n\n${content}`;
            }
        } catch (err: any) {
            window.showErrorMessage(`Erro ao processar: ${item.uri.fsPath}. Motivo: ${err.message}`);
        }
    }

    try {
        const result = await getCommandForAction(action, rootPath, combinedContent, context);
        window.showInformationMessage(`Comando executado com sucesso: ${result}`);
    } catch (err: any) {
        window.showErrorMessage(err.message);
    }
}