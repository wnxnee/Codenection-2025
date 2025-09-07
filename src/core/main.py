import subprocess
import os
import sys

def run_generate():
    base_dir = os.path.dirname(__file__)
    doc_gen_script = os.path.join(base_dir, "doc_generator.py")
    ai_script = os.path.join(base_dir, "ai.py")

    # Handle command-line arguments:
    # sys.argv[1] might be the mode ("generate"),
    # sys.argv[2] is the actual workspace path
    if len(sys.argv) >= 3 and sys.argv[1] == "generate":
        workspace_path = sys.argv[2]
    elif len(sys.argv) >= 2:
        workspace_path = sys.argv[1]
    else:
        workspace_path = os.getcwd()

    # Run the documentation generator first
    subprocess.run(["python", doc_gen_script, workspace_path], check=True)

    # Run the AI script with the correct workspace path
    subprocess.run(["python", ai_script, workspace_path], check=True)

if __name__ == "__main__":
    run_generate()
