const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { reviewMarkdownFile } = require("./reviewMarkdownFile");
const { runPythonTask } = require("../utils/utils");
const { checkDifference } = require('../check_different');

function registerGenerateDocs(context, provider, outputChannel) {
    const generateCmd = vscode.commands.registerCommand('documentationGenerator.generate', async () => {
        const { selectedDocType, selectedSections } = provider.getSelections();

        // Ensure doc type is selected
        if (!selectedDocType) {
            vscode.window.showErrorMessage('Please select a documentation type.');
            return;
        }

        // Ensure workspace is open
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a folder in your workspace first.');
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const filePath = path.join(workspacePath, 'generate.json');
        
        // Handle existing generate.json
        if (fs.existsSync(filePath)) {
            const choice = await vscode.window.showWarningMessage(
                `'generate.json' already exists. Update it or Overwrite?`,
                { modal: true },
                'Update',
                'Overwrite'
            );
            if (choice === 'Update') {
                const safeName = selectedDocType.replace(/\s+/g, "_");
                const preSelectedFile = `${safeName}.md`;
                checkDifference(workspacePath, outputChannel, preSelectedFile);
                return;
            }
            if (choice !== 'Overwrite') return;
        }

        // Write new generate.json
        const content = JSON.stringify(
            { documentationType: selectedDocType, sections: selectedSections },
            null,
            4
        );
        fs.writeFileSync(filePath, content, 'utf8');
        vscode.window.showInformationMessage(`'generate.json' created. Starting documentation generation...`);

        // --- Run Python script ---
        outputChannel.show(true);
        outputChannel.appendLine('Starting Python script for documentation generation...');
        
        try {
            // Run Python main.py in "generate" mode
            await runPythonTask("generate", workspacePath, outputChannel);

            // Find latest generated .md file
            const files = fs.readdirSync(workspacePath)
                .filter((f) => f.endsWith(".md"))
                .map((f) => ({ f, time: fs.statSync(path.join(workspacePath, f)).mtime }))
                .sort((a, b) => b.time - a.time);

            if (files.length === 0) {
                vscode.window.showErrorMessage("No generated Markdown file found.");
                return;
            }

            const latestFile = path.join(workspacePath, files[0].f);
            const fileName = files[0].f;

            // Run review flow
            await reviewMarkdownFile(latestFile, fileName);

        } catch (err) {
            vscode.window.showErrorMessage(
                "Documentation generation failed. Check the output channel for details."
            );
            outputChannel.appendLine(err.message);
        }
    });

    context.subscriptions.push(generateCmd);
}

module.exports = { registerGenerateDocs };
