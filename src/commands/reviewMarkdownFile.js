const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Review a Markdown file interactively in VS Code.
 * @param {string} latestFile - Path to the Markdown file to review
 * @param {string} fileName - File name for display
 */
async function reviewMarkdownFile(latestFile, fileName) {
    const fileContent = fs.readFileSync(latestFile, 'utf8');
    const sections = fileContent.split(/^## /m).filter(Boolean);

    // Extract only headings for template
    const headings = sections.map(s => "## " + s.trim().split("\n")[0]);
    const templateContent = headings.join("\n\n") + "\n";
    const templatePath = path.join(
        path.dirname(latestFile),
        `${fileName.replace('.md', '')}_Template.md`
    );
    fs.writeFileSync(templatePath, templateContent, 'utf8');

    // Open diff view
    await vscode.commands.executeCommand(
        "vscode.diff",
        vscode.Uri.file(templatePath),
        vscode.Uri.file(latestFile),
        `Review: ${fileName}`
    );

    // Per-section Accept / Reject
    let finalContent = "";
    for (const section of sections) {
        const sectionText = "## " + section.trim();
        const heading = sectionText.split("\n")[0];

        const choice = await vscode.window.showInformationMessage(
            `Keep section "${heading}"?`,
            { modal: true },
            "Accept",
            "Reject"
        );

        if (choice === "Accept") {
            finalContent += sectionText + "\n\n";
        } else {
            finalContent += heading + "\n\n"; // keep only heading
        }
    }

    // Remove JSON code blocks before saving
    finalContent = finalContent.replace(/```json[\s\S]*?```/g, '').trim();

    // Save reviewed file
    fs.writeFileSync(latestFile, finalContent, 'utf8');
    vscode.window.showInformationMessage(`Review complete. Updated: ${fileName}`);

    // Reopen updated document
    const doc = await vscode.workspace.openTextDocument(latestFile);
    await vscode.window.showTextDocument(doc, { preview: false });
    try { if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath); } catch {}
}

module.exports = { reviewMarkdownFile };
