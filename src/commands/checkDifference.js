const vscode = require('vscode');
const path = require('path');
const { checkDifference } = require('../check_different');

function registerCheckDifference(context, outputChannel) {
    const cmd = vscode.commands.registerCommand('documentationGenerator.checkDifference', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a folder in your workspace first.');
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        checkDifference(workspacePath, outputChannel);
    });

    context.subscriptions.push(cmd);
}

module.exports = { registerCheckDifference };
