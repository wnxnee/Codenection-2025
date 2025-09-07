const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

function registerPreviewMarkdown(context) {
    const previewCmd = vscode.commands.registerCommand('documentationGenerator.previewMarkdown', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return vscode.window.showErrorMessage('Please open a folder first.');
        const workspacePath = workspaceFolders[0].uri.fsPath;

        // Get all markdown files in workspace
        const mdFiles = fs.readdirSync(workspacePath)
            .filter(f => f.endsWith('.md'))
            .sort();

        if (mdFiles.length === 0) {
            return vscode.window.showErrorMessage('No Markdown files found in workspace.');
        }

        // If only one file, use it directly; otherwise ask user to choose
        let fileName;
        if (mdFiles.length === 1) {
            fileName = mdFiles[0];
        } else {
            const selectedFile = await vscode.window.showQuickPick(mdFiles, {
                placeHolder: 'Select a Markdown file to preview',
                title: 'Choose File to Preview'
            });
            if (!selectedFile) return;
            fileName = selectedFile;
        }

        const filePath = path.join(workspacePath, fileName);

        if (!fs.existsSync(filePath)) {
            return vscode.window.showErrorMessage(`File not found: ${fileName}`);
        }

        // Read Markdown content and convert to HTML
        const mdContent = fs.readFileSync(filePath, 'utf8');
        const htmlContent = marked.parse(mdContent);

        // Open Webview panel with enhanced styling
        const panel = vscode.window.createWebviewPanel(
            'markdownPreview',
            `Preview: ${fileName}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview: ${fileName}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        padding: 20px; 
                        line-height: 1.6;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    h1, h2, h3, h4, h5, h6 { 
                        margin-top: 1.5em; 
                        margin-bottom: 0.5em;
                        color: var(--vscode-textLink-foreground);
                    }
                    h1 { border-bottom: 2px solid var(--vscode-textLink-foreground); padding-bottom: 0.3em; }
                    h2 { border-bottom: 1px solid var(--vscode-textLink-foreground); padding-bottom: 0.2em; }
                    pre { 
                        background: var(--vscode-textCodeBlock-background); 
                        padding: 15px; 
                        overflow-x: auto; 
                        border-radius: 6px;
                        border: 1px solid var(--vscode-panel-border);
                    }
                    code { 
                        background: var(--vscode-textCodeBlock-background); 
                        padding: 2px 6px; 
                        border-radius: 3px;
                        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    }
                    blockquote {
                        border-left: 4px solid var(--vscode-textLink-foreground);
                        margin: 0;
                        padding-left: 20px;
                        color: var(--vscode-descriptionForeground);
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 1em 0;
                    }
                    th, td {
                        border: 1px solid var(--vscode-panel-border);
                        padding: 8px 12px;
                        text-align: left;
                    }
                    th {
                        background-color: var(--vscode-textCodeBlock-background);
                        font-weight: bold;
                    }
                    a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    ul, ol {
                        padding-left: 2em;
                    }
                    li {
                        margin: 0.3em 0;
                    }
                    .header {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 10px 15px;
                        border-radius: 6px;
                        margin-bottom: 20px;
                        border: 1px solid var(--vscode-panel-border);
                    }
                    .header h1 {
                        margin: 0;
                        border: none;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📄 ${fileName}</h1>
                    <p>Generated documentation preview</p>
                </div>
                ${htmlContent}
            </body>
            </html>
        `;

        /*// Ask user for the filename
        const fileName = await vscode.window.showInputBox({
            prompt: 'Enter the Markdown filename to preview (e.g., README.md)'
        });
        if (!fileName) return;

        const filePath = path.join(workspacePath, fileName);

        if (!fs.existsSync(filePath)) {
            return vscode.window.showErrorMessage(`File not found: ${fileName}`);
        }

        // Read Markdown content and convert to HTML
        const mdContent = fs.readFileSync(filePath, 'utf8');
        const htmlContent = marked.parse(mdContent);

        // Open Webview panel
        const panel = vscode.window.createWebviewPanel(
            'markdownPreview',
            `Preview: ${fileName}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
                    code { background: #f5f5f5; padding: 2px 4px; }
                    h1, h2, h3, h4, h5, h6 { margin-top: 1.2em; }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;*/
    });

    context.subscriptions.push(previewCmd);
}

module.exports = { registerPreviewMarkdown };
