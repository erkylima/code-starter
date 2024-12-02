import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getCommandForAction } from '../utils/fileUtils';
import { FileItem } from '../models/fileItem';

export async function generateOutputCommand(
    treeView: vscode.TreeView<FileItem>,
    rootPath: string,
    context: vscode.ExtensionContext
) {
    const selectedItems = treeView.selection;

    // if (selectedItems.length === 0) {
    //     vscode.window.showWarningMessage('Nenhum arquivo ou pasta selecionado!');
    //     return;
    // }

    const action = await vscode.window.showQuickPick(['Testfy', 'Crudify', 'Crufidy Gateway'], {
        placeHolder: 'Escolha a ação que deseja realizar com os arquivos selecionados', 
    });

    if (!action) {
        vscode.window.showInformationMessage('Nenhuma ação selecionada.');
        return;
    }

    let combinedContent = '';

    for (const item of selectedItems) {
        try {
            const stats = fs.statSync(item.uri.fsPath);

            if (stats.isDirectory()) {
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
                const content = fs.readFileSync(item.uri.fsPath, 'utf-8');
                combinedContent += `\n\n--- File: ${path.basename(item.uri.fsPath)} ---\n\n${content}`;
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`Erro ao processar: ${item.uri.fsPath}. Motivo: ${err.message}`);
        }
    }

    try {
        const result = await getCommandForAction(action, rootPath, combinedContent, context);
        vscode.window.showInformationMessage(`Comando executado com sucesso: ${result}`);
    } catch (err: any) {
        vscode.window.showErrorMessage(err.message);
    }
}