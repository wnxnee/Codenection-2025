const vscode = require('vscode');
const { DocumentationProvider } = require('./src/providers/DocumentationProvider');

// Commands
const { registerGenerateDocs } = require('./src/commands/generateDocs');
const { registerPreviewMarkdown } = require('./src/commands/previewMarkdown');
const { registerCheckDifference } = require('./src/commands/checkDifference');

// Validation
const { registerValidation } = require('./src/validation/diagnostics');
const { registerQuickFixes } = require('./src/validation/quickFixes');

function activate(context) {
    const provider = new DocumentationProvider();
    vscode.window.registerTreeDataProvider('documentationGenerator', provider);

    const outputChannel = vscode.window.createOutputChannel("Doc Generator");

    // --- Register existing commands ---
    context.subscriptions.push(vscode.commands.registerCommand('documentationGenerator.toggleRadio', (item) => provider.toggleRadio(item)));
    context.subscriptions.push(vscode.commands.registerCommand('documentationGenerator.toggleCheckbox', (item) => provider.toggleCheckbox(item)));
    context.subscriptions.push(vscode.commands.registerCommand('documentationGenerator.addDocType', async () => {
        const label = await vscode.window.showInputBox({ prompt: 'Enter the new documentation type' });
        if (label) provider.addDocType(label);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('documentationGenerator.addSection', async () => {
        const label = await vscode.window.showInputBox({ prompt: 'Enter the new section name' });
        if (label) provider.addSection(label);
    }));

    context.subscriptions.push(
        vscode.commands.registerCommand('documentationGenerator.openDocGenView', () => {
            vscode.commands.executeCommand('workbench.view.extension.docGenView');
        })
    );
    
    // Register commands
    registerGenerateDocs(context, provider, outputChannel);
    registerPreviewMarkdown(context);
    registerCheckDifference(context, outputChannel);

    // Register validation + quick fixes
    registerValidation(context);
    registerQuickFixes(context);
}

exports.activate = activate;
