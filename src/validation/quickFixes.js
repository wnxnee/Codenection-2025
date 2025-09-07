const vscode = require('vscode');
const { CUSTOM_CODES } = require('../utils/constants');

function registerQuickFixes() {
    vscode.languages.registerCodeActionsProvider("markdown", {
        provideCodeActions(document, range, context) {
            const actions = [];

            for (const diagnostic of context.diagnostics) {
                const line = document.lineAt(diagnostic.range.start.line);
                const lineNum = diagnostic.range.start.line;

                // ---------- CUSTOM: unmatched "(" ----------
                if (diagnostic.code === CUSTOM_CODES.UNMATCHED_PAREN) {
                    const fixed = line.text + ")".repeat(diagnostic.missing || 1);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixed);
                    const action = new vscode.CodeAction(
                        `Add ${diagnostic.missing} closing “)”`,
                        vscode.CodeActionKind.QuickFix
                    );
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    action.isPreferred = true;
                    actions.push(action);
                }

                // ---------- CUSTOM: unmatched bold "**" ----------
                if (diagnostic.code === CUSTOM_CODES.UNMATCHED_BOLD) {
                    const fixed = line.text + "**".repeat(diagnostic.missing || 1);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixed);
                    const action = new vscode.CodeAction(
                        `Add closing "**"`,
                        vscode.CodeActionKind.QuickFix
                    );
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    action.isPreferred = true;
                    actions.push(action);
                }

                // 🔹 MD001: Heading levels increment by one
                if (diagnostic.message.includes("Heading levels should only increment")) {
                    const fixedText = line.text.replace(/^(#+)/, (m) => "#".repeat(m.length - 1));
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixedText);
                    const action = new vscode.CodeAction("Fix heading level", vscode.CodeActionKind.QuickFix);
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }

                // 🔹 MD009: No trailing spaces
                if (diagnostic.message.includes("Trailing spaces")) {
                    const fixedText = line.text.replace(/\s+$/, "");
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixedText);
                    const action = new vscode.CodeAction("Remove trailing spaces", vscode.CodeActionKind.QuickFix);
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }

                // 🔹 MD022: Headings should be surrounded by blank lines
                if (diagnostic.message.includes("Headings should be surrounded by blank lines")) {
                    if (lineNum > 0 && document.lineAt(lineNum - 1).text.trim() !== "") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(document.uri, new vscode.Position(lineNum, 0), "\n");
                        const action = new vscode.CodeAction("Insert blank line before heading", vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    }
                    if (lineNum < document.lineCount - 1 && document.lineAt(lineNum + 1).text.trim() !== "") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(document.uri, new vscode.Position(lineNum + 1, 0), "\n");
                        const action = new vscode.CodeAction("Insert blank line after heading", vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    }
                }

                // 🔹 MD023: Headings must start at beginning
                if (diagnostic.message.includes("Headings must start")) {
                    const fixedText = line.text.trimStart();
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixedText);
                    const action = new vscode.CodeAction("Align heading to start of line", vscode.CodeActionKind.QuickFix);
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }

                // 🔹 MD031: Fenced code blocks surrounded by blank lines
                if (diagnostic.message.includes("Fenced code blocks should be surrounded")) {
                    if (lineNum > 0 && document.lineAt(lineNum - 1).text.trim() !== "") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(document.uri, new vscode.Position(lineNum, 0), "\n");
                        const action = new vscode.CodeAction("Insert blank line before code block", vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    }
                    if (lineNum < document.lineCount - 1 && document.lineAt(lineNum + 1).text.trim() !== "") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(document.uri, new vscode.Position(lineNum + 1, 0), "\n");
                        const action = new vscode.CodeAction("Insert blank line after code block", vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    }
                }

                // 🔹 MD032: Lists surrounded by blank lines
                if (diagnostic.message.includes("Lists should be surrounded")) {
                    if (lineNum > 0 && document.lineAt(lineNum - 1).text.trim() !== "") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(document.uri, new vscode.Position(lineNum, 0), "\n");
                        const action = new vscode.CodeAction("Insert blank line before list", vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    }
                    if (lineNum < document.lineCount - 1 && document.lineAt(lineNum + 1).text.trim() !== "") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(document.uri, new vscode.Position(lineNum + 1, 0), "\n");
                        const action = new vscode.CodeAction("Insert blank line after list", vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        actions.push(action);
                    }
                }

                // 🔹 MD039: No spaces inside emphasis markers
                if (diagnostic.message.includes("No spaces inside emphasis markers")) {
                    const fixedText = line.text.replace(/(\*+)\s+(.+?)\s+(\*+)/g, "$1$2$3");
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixedText);
                    const action = new vscode.CodeAction("Remove spaces inside emphasis markers", vscode.CodeActionKind.QuickFix);
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }

                // 🔹 MD025: Only one H1 per document
                if (diagnostic.message.includes("Multiple top-level headings")) {
                    const fixedText = line.text.replace(/^#/, "##");
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, line.range, fixedText);
                    const action = new vscode.CodeAction("Convert to H2 (fix multiple H1s)", vscode.CodeActionKind.QuickFix);
                    action.edit = edit;
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }
            }

            return actions;
        }
    });
}

module.exports = { registerQuickFixes };
