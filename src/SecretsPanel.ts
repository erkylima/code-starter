import { ExtensionContext, Uri, WebviewPanel, window, ViewColumn } from 'vscode';

export class SecretsPanel {
  public static currentPanel: SecretsPanel | undefined;
  private readonly _panel: WebviewPanel;
  private readonly _extensionUri: Uri;
  private readonly _context: ExtensionContext;

  private constructor(panel: WebviewPanel, extensionUri: Uri, context: ExtensionContext) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._context = context;
    this._panel.webview.html = this._getHtmlForWebview();
    this._setWebviewMessageListener();
    this._loadSecretsToWebview();

    this._panel.onDidDispose(() => this.dispose(), null, context.subscriptions);
  }

  public static createOrShow(context: ExtensionContext) {
    if (SecretsPanel.currentPanel) {
      SecretsPanel.currentPanel._panel.reveal();
    } else {
      const panel = window.createWebviewPanel(
        'secretsPanel',
        'API Secrets Manager',
        ViewColumn.One,
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
        const tenant = await secretStorage.get('tenant');

        // Envia os valores para o Webview
        this._panel.webview.postMessage({
          command: 'loadSecrets',
          data: { clientId, clientSecret, grantType, tenant }
        });
      } else {
        window.showErrorMessage('Erro ao acessar o armazenamento seguro.');
      }
    } catch (error: any) {
      window.showErrorMessage(`Erro ao carregar secrets: ${error.message}`);
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
          <input type="text" id="grantType" name="grantType"><br>
          <label for="tenant">Tenant:</label><br>
          <input type="text" id="tenant" name="tenant"><br><br>
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
              document.getElementById('tenant').value = message.data.tenant || '';
            }
          });

          document.getElementById('secretsForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const clientId = document.getElementById('clientId').value;
            const clientSecret = document.getElementById('clientSecret').value;
            const grantType = document.getElementById('grantType').value;
            const tenant = document.getElementById('tenant').value;

            vscode.postMessage({
              command: 'saveSecrets',
              data: { clientId, clientSecret, grantType, tenant }
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
            window.showInformationMessage('Secrets saved securely!');
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

  private async _saveSecretsToStorage(data: { clientId: string; clientSecret: string; grantType: string, tenant: string }) {
    try {
      const secretStorage = this._context.secrets;

      if (secretStorage) {
        await secretStorage.store('clientId', data.clientId);
        await secretStorage.store('clientSecret', data.clientSecret);
        await secretStorage.store('grantType', data.grantType);
        await secretStorage.store('tenant', data.tenant);

        window.showInformationMessage('Secrets salvos com segurança!');
      } else {
        window.showErrorMessage('Erro ao acessar o armazenamento seguro.');
      }
    } catch (error: any) {
      window.showErrorMessage(`Erro ao salvar secrets: ${error.message}`);
    }
  }
}