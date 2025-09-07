const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const vscode = require("vscode");

function safeRead(p) {
    try { return fs.readFileSync(p); } catch { return null; }
}

function runPythonTask(mode, workspacePath, outputChannel) {
    return new Promise((resolve, reject) => {
        const mainPyPath = path.join(__dirname, "../../src/core/main.py");
        const pythonProcess = spawn("python", [mainPyPath, mode, workspacePath]);

        pythonProcess.stdout.on("data", (data) => outputChannel.appendLine(data.toString()));
        pythonProcess.stderr.on("data", (data) => outputChannel.appendLine(`[ERROR] ${data.toString()}`));

        pythonProcess.on("close", (code) => {
            if (code === 0) {
                outputChannel.appendLine(`Python ${mode} task completed.`);
                resolve();
            } else {
                outputChannel.appendLine(`Python ${mode} task failed with code ${code}`);
                reject(new Error(`Python ${mode} failed (exit ${code})`));
            }
        });
    });
}

/**
 * runParser:
 * Runs doc_generator.py robustly and ensures new_parsed_code.json is created.
 */
function runParser({ workspacePath, parserScriptPath, parsedFolder, outputChannel }) {
    return new Promise((resolve, reject) => {
        const baselinePath = path.join(parsedFolder, "parsed_code.json");
        const newParsedPath = path.join(parsedFolder, "new_parsed_code.json");

        try { fs.mkdirSync(parsedFolder, { recursive: true }); } catch {}

        const baselineBackup = path.join(parsedFolder, "parsed_code.backup.json");
        const hadBaseline = fs.existsSync(baselinePath);
        if (hadBaseline) {
            try { fs.copyFileSync(baselinePath, baselineBackup); } catch (e) {
                return reject(new Error("Failed to backup baseline parsed_code.json: " + e.message));
            }
        }

        outputChannel?.show?.(true);
        outputChannel?.appendLine?.(`Running parser: ${parserScriptPath}`);

        if (!fs.existsSync(parserScriptPath)) return reject(new Error(`doc_generator.py not found at: ${parserScriptPath}`));

        const p = spawn("python", [parserScriptPath, workspacePath], { cwd: path.dirname(parserScriptPath) });

        p.stdout.on("data", d => outputChannel?.appendLine?.(d.toString()));
        p.stderr.on("data", d => outputChannel?.appendLine?.("[ERROR] " + d.toString()));

        p.on("close", code => {
            try {
                if (code !== 0) throw new Error("doc_generator.py failed (exit " + code + ")");

                const candidates = [
                    path.join(parsedFolder, "parsed_code.json"),
                    path.join(workspacePath, "parsed_code.json")
                ].filter(pth => fs.existsSync(pth));

                if (candidates.length === 0) throw new Error("Parser finished but no parsed_code.json was found.");

                const produced = candidates
                    .map(pth => ({ pth, m: fs.statSync(pth).mtimeMs }))
                    .sort((a, b) => b.m - a.m)[0].pth;

                fs.copyFileSync(produced, newParsedPath);

                if (produced === baselinePath && hadBaseline) {
                    const backupBuf = safeRead(baselineBackup);
                    if (backupBuf) fs.writeFileSync(baselinePath, backupBuf);
                }

                if (hadBaseline && fs.existsSync(baselineBackup)) {
                    try { fs.unlinkSync(baselineBackup); } catch {}
                }

                if (!fs.existsSync(newParsedPath)) throw new Error("new_parsed_code.json not created");

                outputChannel?.appendLine?.(`Created ${newParsedPath}`);
                resolve(newParsedPath);
            } catch (err) {
                try {
                    if (fs.existsSync(baselineBackup)) fs.copyFileSync(baselineBackup, baselinePath);
                } catch {}
                reject(err);
            }
        });
    });
}

/**
 * runAIUpdate:
 * Runs ai_update.py to produce new Markdown from old/new parsed JSON.
 */

function runAIUpdate({ diffPath, oldMdPath, newMdPath, generateJson, workspacePath, outputChannel }) {
    return new Promise((resolve, reject) => {
        const aiScript = path.join(__dirname, "../../src/core/ai_update.py");
        const args = [aiScript, diffPath, generateJson, oldMdPath, newMdPath];

        outputChannel?.appendLine?.("Calling AI to create updated markdown...");
        const p = spawn("python", args, { cwd: path.dirname(aiScript) });

        let stdoutBuffer = "";

        p.stdout.on("data", d => {
            const text = d.toString();
            stdoutBuffer += text;
            outputChannel?.appendLine?.(text);
        });

        p.stderr.on("data", d => {
            outputChannel?.appendLine?.("[ERROR] " + d.toString());
        });

        p.on("close", code => {
            if (code !== 0) return reject(new Error("AI update failed (exit " + code + ")"));
            if (!fs.existsSync(newMdPath)) return reject(new Error("AI did not output the new Markdown file"));

            // Extract summary between markers
            const match = stdoutBuffer.match(/===SUMMARY_START===([\s\S]*?)===SUMMARY_END===/);
            if (match) {
                const diffSummary = match[1].trim();
                vscode.window.showInformationMessage(diffSummary);
            }

            resolve(newMdPath);
        });
    });
}

module.exports = { runPythonTask, runParser, runAIUpdate };
