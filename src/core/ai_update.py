import os
import json
import sys
import openai
from dotenv import load_dotenv
import re

# --- Load environment variables ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Error: OpenAI API key not found. Please create a .env file with OPENAI_API_KEY='your_key'.")
    sys.exit(1)

openai.api_key = OPENAI_API_KEY

# --- Helper Functions ---
def load_json_file(file_path):
    """Safely load a JSON file."""
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        sys.exit(1)
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def query_ai(prompt):
    """Send a prompt to OpenAI API and get response."""
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=4000,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"An error occurred during AI query: {e}")
        sys.exit(1)

def build_prompt(differences, old_md):
    """Build the AI update prompt."""
    prompt = f"""
You are a **precise documentation updater**.

Below is the **previous documentation** that serves as the base:
```markdown
{old_md}

Here is the **JSON differences** between old and new code:
{json.dumps(differences, indent=2)}

## GOAL
Produce UPDATED_MARKDOWN that is **identical to OLD_MARKDOWN except** for **minimal, surgical edits** strictly required to reflect differences.

Task:
- Update only text that is directly related to the JSON differences.
- Keep section order, headings, and any unchanged text exactly as-is.
- Do not invent APIs or behavior. If uncertain, keep the original wording.
- Do not rewrite the whole document.
- Keep the top-level H1 exactly the same.
- H2 headings must use the exact `## ` syntax and remain stable unless a new H2 is strictly needed.
- Every H2 section must contain at least three sentence or explanation. Never leave a section blank.
- Follow markdownlint rules.

Output
Return two fenced blocks:

```markdown
(The updated full markdown document goes here)
```

```
json
(The JSON array of H2 section titles goes here)
```
"""
    return prompt

#Main Execution

if __name__ == "__main__":
    # Usage: python ai_update.py <parsed_folder> <generate_json_path>
    if len(sys.argv) < 5:
        print("Usage: python ai_update.py <diff_path> <generate_json_path> <old_md_path> <new_md_path>")
        sys.exit(1)

    diff_path = sys.argv[1]
    generate_json_path = sys.argv[2]
    old_md_path = sys.argv[3]
    new_md_path = sys.argv[4]

    differences = load_json_file(diff_path)
    generate_config = load_json_file(generate_json_path)

    md_folder = os.path.dirname(old_md_path)
    existing_md = os.path.basename(old_md_path)

    # Load the old Markdown (from same folder as generate.json)
    with open(old_md_path, "r", encoding="utf-8") as f:
        old_md = f.read()

    if not old_md:
        print("Error: No existing .md file found in folder.")
        sys.exit(1)

    # Build prompt and query AI
    prompt = build_prompt(differences, old_md)
    print("Sending prompt to AI...")
    docs_output = query_ai(prompt)

    # Extract Markdown
    pattern_md = re.compile(r"```(?:markdown|md)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
    md_match = pattern_md.search(docs_output)
    markdown_content = md_match.group(1).strip() if md_match else docs_output.strip()

    # Extract JSON array
    pattern_json = re.compile(r"```json\s*(.*?)```", re.DOTALL | re.IGNORECASE)
    json_match = pattern_json.search(docs_output)
    sections_array = []
    if json_match:
        try:
            sections_array = json.loads(json_match.group(1))
        except json.JSONDecodeError:
            print(" Warning: AI returned invalid JSON for sections. Using empty list.")

    # Save as *_new.md
    base, ext = os.path.splitext(existing_md)
    output_filename = f"{base}_new{ext}"
    output_path = os.path.join(md_folder, output_filename)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    print(f"Successfully generated updated documentation at: {output_path}")

    # --- Ask AI for summary of differences between old and new docs ---
    try:
        summary_prompt = f"""
Compare the following two Markdown documents and provide a single, concise sentence
describing the changes between them, e.g., which section(s) have been updated.

Old Document:
```markdown
{old_md}

New Document:
{markdown_content}
Return only one sentence, clearly stating the updated section(s).
"""
        print("\n Generating summary of differences...")
        diff_summary = query_ai(summary_prompt)

        # Markers for VS Code extension to capture
        print("===SUMMARY_START===")
        print(diff_summary.strip())
        print("===SUMMARY_END===")

    except Exception as e:
        print(f"Warning: Could not generate summary of differences: {e}")