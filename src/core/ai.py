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
            temperature=0.3,
            max_tokens=4000,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"An error occurred during AI query: {e}")
        sys.exit(1)

def build_prompt(parsed_code, doc_type, sections):
    """Build the dynamic prompt for the AI."""
    
    sections_instruction = ""
    if sections:
        # If user provided sections, instruct the AI to include them plus suggest others
        sections_text = "\n   - " + "\n   - ".join(sections)
        sections_instruction = f"""The user has requested the following sections. You MUST include them in your response, but you can also add other relevant sections if you think they are necessary:
   {sections_text}"""
    else:
        # If no sections are provided, ask the AI to suggest and generate them
        sections_instruction = "The user has not specified any sections. Please suggest and generate a complete set of relevant sections for this documentation."

    prompt = f"""
You are a technical documentation assistant.

Here is the parsed codebase JSON for the project:
{json.dumps(parsed_code, indent=2)}

Your task is to generate two things:
1. A comprehensive Markdown document titled '{doc_type}'.
2. A JSON array of the main H2 section titles from the document you generated.

The document must strictly follow markdownlint rules:
- Only one H1 heading per document.
- Headings must increase by one level at a time (H1 → H2 → H3).
- Use blank lines before and after headings, lists, and code blocks.
- Use proper list formatting (a space after - or *).
- No trailing spaces at the end of lines.
- Wrap lines at around 80 characters max.
- Always use fenced code blocks with language identifiers.
- Use consistent style for links and emphasis.

{sections_instruction}

Please format your response with two distinct, clearly marked, fenced code blocks:

```markdown
(The full markdown content goes here)
```

```
json
(The JSON array of H2 section titles goes here)
```
"""
    return prompt

# --- Main Execution ---

if __name__ == "__main__":
    # The workspace path is passed as a command-line argument
    workspace_path = sys.argv[1] if len(sys.argv) > 1 else '.'
    script_dir = os.path.dirname(__file__)

    # Load the necessary JSON files
    parsed_code = load_json_file(os.path.join(script_dir, "parsed_code.json"))
    generate_config = load_json_file(os.path.join(workspace_path, "generate.json"))

    doc_type = generate_config.get("documentationType", "Documentation")
    sections = generate_config.get("sections", [])

    # Build the prompt and query the AI
    prompt = build_prompt(parsed_code, doc_type, sections)
    print("Sending prompt to AI...")
    docs_output = query_ai(prompt)

    # Extract Markdown content
    pattern_md = re.compile(r'```markdown\n(.*?)```', re.DOTALL)
    md_match = pattern_md.search(docs_output)
    markdown_content = md_match.group(1).strip() if md_match else docs_output.strip()

    # Extract JSON array
    pattern_json = re.compile(r'```json\n(.*?)```', re.DOTALL)
    json_match = pattern_json.search(docs_output)
    sections_array = json.loads(json_match.group(1)) if json_match else []

    # Save the generated documentation
    output_filename = f"{doc_type.replace(' ', '_')}.md"
    output_path = os.path.join(workspace_path, output_filename)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(docs_output.strip())

    print(f"Successfully generated documentation at: {output_path}")

