const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { runParser, runAIUpdate } = require("./utils/utils");
const deepDiff = require("deep-diff").diff;

/**
 * Split markdown into sections by "## "
 */
function splitBySections(mdContent) {
    const sections = {};
    const lines = mdContent.split(/\r?\n/);
    let currentTitle = null;
    let buffer = [];

    for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            // Save previous section
            if (currentTitle) {
                sections[currentTitle] = buffer.join("\n").trim();
            }
            currentTitle = `${headingMatch[1]} ${headingMatch[2]}`.trim();
            buffer = [];
        } else {
            buffer.push(line);
        }
    }

    // Save last section
    if (currentTitle) {
        sections[currentTitle] = buffer.join("\n").trim();
    }

    return sections;
}


/**
 * Main Check Difference flow
 */
async function checkDifference(workspacePath, outputChannel, preSelectedFile) {
    try {
        // Ask for Markdown filename
        let mdName = preSelectedFile;
        if (!mdName) {
            // Get all markdown files in workspace
            const mdFiles = fs.readdirSync(workspacePath)
                .filter(f => f.endsWith(".md"))
                .sort();

            if (mdFiles.length === 0) {
                vscode.window.showErrorMessage("No Markdown files found in workspace.");
                return;
            }

            if (mdFiles.length === 1) {
                mdName = mdFiles[0];
            } else {
                const selectedFile = await vscode.window.showQuickPick(mdFiles, {
                    placeHolder: "Select a Markdown file to check",
                    title: "Choose File to Compare"
                });
                if (!selectedFile) return; // cancelled
                mdName = selectedFile;
            }
        }

        const oldMdPath = path.join(workspacePath, mdName);
        if (!fs.existsSync(oldMdPath)) {
            vscode.window.showErrorMessage(`Not found: ${mdName}`);
            return;
        }
        
        const oldParsed = path.join(__dirname, "core", "parsed_code.json");
        if (!fs.existsSync(oldParsed)) {
            vscode.window.showErrorMessage("Missing parsed_code.json (old). Run a generation at least once.");
            return;
        }

        const parsedFolder = path.dirname(oldParsed);
        const parserScriptPath = path.join(parsedFolder, "doc_generator.py");
        const generateJson = path.join(workspacePath, "generate.json");
        if (!fs.existsSync(generateJson)) {
            vscode.window.showErrorMessage("Missing generate.json. Create it via the Generate command first.");
            return;
        }

        // Run parser → new_parsed_code.json
        const newParsed = await runParser({ workspacePath, parserScriptPath, parsedFolder, outputChannel });

        const oldJson = JSON.parse(fs.readFileSync(oldParsed, "utf8"));
        const newJson = JSON.parse(fs.readFileSync(newParsed, "utf8"));

        // Compute JSON diff
        const differences = deepDiff(oldJson, newJson) || [];
        const diffPath = path.join(workspacePath, "diff.json");
        fs.writeFileSync(diffPath, JSON.stringify(differences, null, 2), "utf8");

        outputChannel.appendLine(`Computed JSON diff, saved at ${diffPath}`);

        const oldParsedFile = path.join(parsedFolder, "parsed_code.json");
        try {
            fs.copyFileSync(newParsed, oldParsedFile);
            outputChannel.appendLine("Promoted new_parsed_code.json -> parsed_code.json");
        } catch (e) {
            outputChannel.appendLine(`Warning: Could not promote new_parsed_code.json: ${e.message}`);
        }

        // AI update → generate new Markdown
        const ext = path.extname(mdName) || ".md";
        const base = mdName.slice(0, -ext.length) || mdName;
        const newMdPath = path.join(workspacePath, `${base}_new${ext}`);

        // AI update → generate new Markdown (now pass diff.json instead of raw JSONs)
        await runAIUpdate({
            diffPath,
            oldMdPath,
            newMdPath,
            generateJson,
            workspacePath,
            outputChannel
        });

        outputChannel.appendLine("AI generated Markdown. Starting diff...");

        // Load both Markdown docs
        const oldMd = fs.readFileSync(oldMdPath, "utf8");
        const newMd = fs.readFileSync(newMdPath, "utf8");

        const oldSections = splitBySections(oldMd);
        const newSections = splitBySections(newMd);

        let finalSections = { ...oldSections };

        outputChannel.appendLine(`Old sections: ${Object.keys(oldSections).join(", ")}`);
        outputChannel.appendLine(`New sections: ${Object.keys(newSections).join(", ")}`);


        // Loop through new sections and show diff + Accept/Reject
        for (const [title, newBody] of Object.entries(newSections)) {
            const oldBody = oldSections[title] || "";
            /*if (oldBody.trim() === newBody.trim()) {
                outputChannel.appendLine(`No changes...`);
                continue;
            }*/

            // Create temporary diff files
            const tmpOld = path.join(workspacePath, `.${title.replace(/\W+/g, "_")}_old.md`);
            const tmpNew = path.join(workspacePath, `.${title.replace(/\W+/g, "_")}_new.md`);
            fs.writeFileSync(tmpOld, `# ${title}\n\n${oldBody}`, "utf8");
            fs.writeFileSync(tmpNew, `# ${title}\n\n${newBody}`, "utf8");

            // Show diff view
            await vscode.commands.executeCommand(
                "vscode.diff",
                vscode.Uri.file(tmpOld),
                vscode.Uri.file(tmpNew),
                `Changes in ${title}`
            );

            const choice = await vscode.window.showInformationMessage(
                `Update section "${title}"?`,
                { modal: true },
                "Accept",
                "Reject"
            );

            if (choice === "Accept") {
                finalSections[title] = newBody;
                outputChannel.appendLine(`Accepted section: ${title}`);
            } else {
                outputChannel.appendLine(`Rejected section: ${title}`);
            }

            // Cleanup temp files
            try { fs.unlinkSync(tmpOld); fs.unlinkSync(tmpNew); } catch {}
            try { fs.unlinkSync(); } catch {}
        }

        // 7) Rebuild final doc
        const finalDoc = Object.entries(finalSections)
            .map(([title, body]) => `${title}\n\n${body}`)
            .join("\n\n");

        fs.writeFileSync(oldMdPath, finalDoc, "utf8");
        outputChannel.appendLine("Documentation updated section by section.");

        // Cleanup new temp Markdown
        try { if (fs.existsSync(newMdPath)) fs.unlinkSync(newMdPath); } catch {}

        const newParsedFile = path.join(parsedFolder, "new_parsed_code.json");
        try { if (fs.existsSync(newParsedFile)) fs.unlinkSync(newParsedFile); } catch {}

    } catch (err) {
        vscode.window.showErrorMessage("Check Difference failed: " + err.message);
    }
}

module.exports = { checkDifference };
