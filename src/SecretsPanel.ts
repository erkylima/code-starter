import * as vscode from 'vscode';

export class SecretsPanel {
  public static currentPanel: SecretsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _context: vscode.ExtensionContext;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._context = context;
    this._panel.webview.html = this._getHtmlForWebview();
    this._setWebviewMessageListener();
    this._loadSecretsToWebview();

    this._panel.onDidDispose(() => this.dispose(), null, context.subscriptions);

  }

  public static createOrShow(context: vscode.ExtensionContext) {
    if (SecretsPanel.currentPanel) {
      SecretsPanel.currentPanel._panel.reveal();
    } else {
      const panel = vscode.window.createWebviewPanel(
        'secretsPanel',
        'API Secrets Manager',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      SecretsPanel.currentPanel = new SecretsPanel(panel, context.extensionUri, context);
    }
  }

  private async _loadSecretsToWebview() {
    try {
      const secretStorage = this._context.secrets;

      if (secretStorage) {
        const clientId = await secretStorage.get('clientId');
        const clientSecret = await secretStorage.get('clientSecret');
        const grantType = await secretStorage.get('grantType');

        // Envia os valores para o Webview
        this._panel.webview.postMessage({
          command: 'loadSecrets',
          data: { clientId, clientSecret, grantType }
        });
      } else {
        vscode.window.showErrorMessage('Erro ao acessar o armazenamento seguro.');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Erro ao carregar secrets: ${error.message}`);
    }
  }

  private _getHtmlForWebview(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Secrets Manager</title>
      </head>
      <body>
        <h1>API Secrets Manager</h1>
        <form id="secretsForm">
          <label for="clientId">Client ID:</label><br>
          <input type="text" id="clientId" name="clientId"><br><br>
          <label for="clientSecret">Client Secret:</label><br>
          <input type="password" id="clientSecret" name="clientSecret"><br><br>
          <label for="grantType">Grant Type:</label><br>
          <input type="text" id="grantType" name="grantType"><br><br>
          <button type="submit">Save</button>
        </form>
        <script>
          const vscode = acquireVsCodeApi();

          // Recebe os dados do backend e preenche o formulário
          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'loadSecrets') {
              document.getElementById('clientId').value = message.data.clientId || '';
              document.getElementById('clientSecret').value = message.data.clientSecret || '';
              document.getElementById('grantType').value = message.data.grantType || '';
            }
          });

          document.getElementById('secretsForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const clientId = document.getElementById('clientId').value;
            const clientSecret = document.getElementById('clientSecret').value;
            const grantType = document.getElementById('grantType').value;
            vscode.postMessage({
              command: 'saveSecrets',
              data: { clientId, clientSecret, grantType }
            });
          });
        </script>
      </body>
      </html>
    `;
  }

  private _setWebviewMessageListener() {
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'saveSecrets':
            await this._saveSecretsToStorage(message.data);
            vscode.window.showInformationMessage('Secrets saved securely!');
            break;
        }
      },
      undefined,
      []
    );
  }

  public dispose() {
    SecretsPanel.currentPanel = undefined;

    // Dispose do painel e de todos os recursos associados
    this._panel.dispose();
  }

  private async _saveSecretsToStorage(data: { clientId: string; clientSecret: string; grantType: string }) {
    try {
        const secretStorage = this._context.secrets;

        if (secretStorage) {
            await secretStorage.store('clientId', data.clientId);
            await secretStorage.store('clientSecret', data.clientSecret);
            await secretStorage.store('grantType', data.grantType);

            vscode.window.showInformationMessage('Secrets salvos com segurança!');
        } else {
            vscode.window.showErrorMessage('Erro ao acessar o armazenamento seguro.');
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Erro ao salvar secrets: ${error.message}`);
    }
  }
}