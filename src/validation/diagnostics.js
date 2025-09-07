const vscode = require('vscode');
const markdownlint = require('markdownlint');
const { CUSTOM_CODES } = require('../utils/constants');

// central entry point
function registerValidation(context) {
    const diagnostics = vscode.languages.createDiagnosticCollection("smartdocs");
    context.subscriptions.push(diagnostics);

    let lintTimeout;
    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId !== "markdown") return;
        clearTimeout(lintTimeout);
        lintTimeout = setTimeout(() => runValidation(event.document, diagnostics), 500);
    });

    vscode.workspace.textDocuments.forEach(doc => runValidation(doc, diagnostics));
    vscode.workspace.onDidOpenTextDocument(doc => runValidation(doc, diagnostics));
    vscode.workspace.onDidSaveTextDocument(doc => runValidation(doc, diagnostics));
}

async function runValidation(doc, diagnostics) {
    const filePath = doc.uri.fsPath;

    try {
        const lintResults = await new Promise((resolve, reject) => {
            const config = {
                "default": false,
                "MD001": true,
                "MD009": true,
                "MD022": true,
                "MD023": true,
                "MD031": true,
                "MD032": true,
                "MD039": true,
                "MD025": true
            };

            markdownlint(
                { strings: { [filePath]: doc.getText() }, config },
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result[filePath]);
                }
            );
        });

        const problems = [];
        if (lintResults && lintResults.length > 0) {
            lintResults.forEach(issue => {
                const range = new vscode.Range(
                    new vscode.Position(issue.lineNumber - 1, 0),
                    new vscode.Position(issue.lineNumber - 1, Number.MAX_SAFE_INTEGER)
                );
                const d = new vscode.Diagnostic(
                    range,
                    `${issue.ruleNames.join("/")} : ${issue.ruleDescription}`,
                    vscode.DiagnosticSeverity.Warning
                );
                d.source = "markdownlint";
                problems.push(d);
            });
        }

        addCustomDiagnostics(doc, problems);
        diagnostics.set(doc.uri, problems);
    } catch (err) {
        vscode.window.showErrorMessage(`Validation error: ${err.message}`);
    }
}

// Custom diagnostics: unmatched parentheses, unmatched bold
function addCustomDiagnostics(doc, outProblems) {
    for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
        const text = doc.lineAt(lineNum).text;

        // --- Unmatched "("
        const openParens = (text.match(/\(/g) || []).length;
        const closeParens = (text.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            const missing = openParens - closeParens;
            const idx = text.indexOf("(");
            if (idx !== -1) {
                const range = new vscode.Range(
                    new vscode.Position(lineNum, idx),
                    new vscode.Position(lineNum, idx + 1)
                );
                const diag = new vscode.Diagnostic(
                    range,
                    `Unmatched "(" — add ${missing} closing ")".`,
                    vscode.DiagnosticSeverity.Warning
                );
                diag.code = CUSTOM_CODES.UNMATCHED_PAREN;
                diag.missing = missing;
                diag.source = "smartdocs";
                outProblems.push(diag);
            }
        }

        // --- Unmatched bold "**"
        const doubleStars = (text.match(/\*\*/g) || []).length;
        const hasOddDoubleStars = doubleStars % 2 === 1;
        const hasSingleCloseAfterDoubleOpen = /(\*\*[^*\n]+)\*(?!\*)/.test(text);

        if ((text.includes("**") && hasOddDoubleStars) || hasSingleCloseAfterDoubleOpen) {
            const missing = 1;
            const startIdx = text.indexOf("**");
            if (startIdx !== -1) {
                const range = new vscode.Range(
                    new vscode.Position(lineNum, startIdx),
                    new vscode.Position(lineNum, Math.min(startIdx + 2, text.length))
                );
                const diag = new vscode.Diagnostic(
                    range,
                    `Unmatched bold marker "**" — add closing "**".`,
                    vscode.DiagnosticSeverity.Warning
                );
                diag.code = CUSTOM_CODES.UNMATCHED_BOLD;
                diag.missing = missing;
                diag.source = "smartdocs";
                outProblems.push(diag);
            }
        }
    }
}

module.exports = { registerValidation, runValidation };
