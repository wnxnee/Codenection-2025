import os
import re
import json
import ast
import subprocess
import sys

# Supported file extensions (you can add more)
SUPPORTED_EXTENSIONS = [".py", ".js", ".ts", ".java", ".rb", ".go", ".cpp", ".c", ".cs"]


def extract_python_definitions(file_path, code):
    """Extract functions, classes, imports, and file docstring from Python code using AST."""
    file_info = {
        "file": os.path.basename(file_path),
        "path": file_path,
        "docstring": None,
        "imports": [],
        "functions": [],
        "classes": [],
        "code": code
    }

    try:
        tree = ast.parse(code)
        file_info["docstring"] = ast.get_docstring(tree)

        for node in ast.walk(tree):
            # Functions
            if isinstance(node, ast.FunctionDef):
                params = [arg.arg for arg in node.args.args]
                doc = ast.get_docstring(node)
                snippet = ast.get_source_segment(code, node)

                file_info["functions"].append({
                    "name": node.name,
                    "parameters": params,
                    "returns": None,
                    "docstring": doc,
                    "code": snippet
                })

            # Classes
            elif isinstance(node, ast.ClassDef):
                doc = ast.get_docstring(node)
                snippet = ast.get_source_segment(code, node)

                file_info["classes"].append({
                    "name": node.name,
                    "docstring": doc,
                    "code": snippet
                })

            # Imports
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                if isinstance(node, ast.Import):
                    names = [alias.name for alias in node.names]
                    file_info["imports"].extend(names)
                else:  # ImportFrom
                    module = node.module if node.module else ""
                    names = [alias.name for alias in node.names]
                    file_info["imports"].append(f"from {module} import {', '.join(names)}")

    except Exception as e:
        file_info["error"] = f"AST parse error: {e}"

    return file_info


def extract_generic_definitions(file_path, code):
    """Fallback parser using regex for non-Python files."""
    definitions = {
        "file": os.path.basename(file_path),
        "path": file_path,
        "docstring": None,
        "imports": [],
        "functions": [],
        "classes": [],
        "code": code
    }

    func_pattern = re.compile(r"(?:function|def|fn|func)\s+(\w+)\s*\(([^)]*)\)", re.MULTILINE)
    class_pattern = re.compile(r"class\s+(\w+)", re.MULTILINE)

    for match in func_pattern.finditer(code):
        params = [p.strip() for p in match.group(2).split(",")] if match.group(2) else []
        definitions["functions"].append({
            "name": match.group(1),
            "parameters": params,
            "docstring": None,
            "code": None
        })

    for match in class_pattern.finditer(code):
        definitions["classes"].append({
            "name": match.group(1),
            "docstring": None,
            "code": None
        })

    return definitions


def extract_definitions(file_path):
    """Extract definitions depending on file type."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()

        if file_path.endswith(".py"):
            return extract_python_definitions(file_path, code)
        else:
            return extract_generic_definitions(file_path, code)

    except Exception as e:
        return {"file": os.path.basename(file_path), "error": f"Error reading {file_path}: {e}"}


def parse_codebase(base_dir="."):
    """Walk through all files and parse codebase."""
    parsed_data = []

    for root, _, files in os.walk(base_dir):
        for file in files:
            if any(file.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
                file_path = os.path.join(root, file)
                parsed_data.append(extract_definitions(file_path))

    return parsed_data


def extract_git_commits(project_dir):
    try:
        result = subprocess.run(
            ["git", "-C", project_dir, "log", "--pretty=format:%H|%an|%ad|%s", "--date=iso"],
            capture_output=True, text=True, check=True
        )
        commits = []
        for line in result.stdout.splitlines():
            parts = line.split("|", 3)
            if len(parts) == 4:
                commits.append({
                    "hash": parts[0],
                    "author": parts[1],
                    "date": parts[2],
                    "message": parts[3],
                })
        return commits
    except subprocess.CalledProcessError:
        print("WARNING: No git history found. Maybe not a git repo?")
        return []
    except FileNotFoundError:
        print("WARNING: Git not installed.")
        return []

if __name__ == "__main__":
    # The script now takes the project directory as a command-line argument
    project_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    results = {
        "codebase": parse_codebase(project_dir),
        "git_commits": extract_git_commits(project_dir)
    }

    # Save the parsed data in the same directory as the script
    output_path = os.path.join(os.path.dirname(__file__), "parsed_code.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)

    print(f"Parsing complete. Results saved at {output_path}")