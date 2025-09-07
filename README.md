# Documentation Generator

A powerful VS Code extension that automatically generates comprehensive documentation for your codebase using AI. This extension analyzes your project structure, parses code files, and creates well-formatted Markdown documentation with customizable sections and types.

## Track & Problem Statement

**Track 3:** *Fix the Docs — Smarter, Faster, Maintainable Documentation for the Real World by iFAST (VS Code Extension)*

**Problem statement:** In real-world tech environments, documentation is slow to create, often inconsistent, and quickly becomes stale as code evolves. This leads to onboarding delays, wasted engineering time, and avoidable bugs. This project tackles two core problems:

1. **Simplify Writing** — Speed up and standardize documentation creation by auto-generating starter docs from code, commits, and comments; offering AI-powered templates, smart prompts, and real-time writing assistance.
2. **Make Maintenance Easy** — Reduce doc-drift by detecting stale documentation, surfacing diffs/PRs that affect docs, and auto-suggesting updates so documentation stays accurate alongside the codebase.

**Selected focus areas:**
- **Simplify Writing** — Auto-generation, templates, AI suggestions, and markdown validation.
- **Make Maintenance Easy** — Stale-doc detection, change notifications, and PR/diff-driven doc suggestions.

## Features

- **AI-Powered Documentation**: Uses OpenAI's GPT-4o-mini to generate intelligent, context-aware documentation
- **Multi-Language Support**: Parses Python, JavaScript, TypeScript, Java, Ruby, Go, C++, C, and C# files
- **Interactive UI**: Clean sidebar interface with radio buttons and checkboxes for easy configuration
- **Customizable Sections**: Choose which documentation sections to include (Introduction, API Reference, Examples, etc.)
- **Multiple Doc Types**: Support for Internal Documentation, External Documentation, API Documentation, and Technical Guides
- **Markdown Validation**: Built-in markdownlint compliance and quick fixes
- **Preview & Review**: Preview generated markdown and review before finalizing
- **Difference Checking**: Compare new documentation with existing files

## Prerequisites

- **VS Code**: Version 1.80.0 or higher
- **Python**: 3.7+ with pip
- **Node.js**: For VS Code extension development
- **OpenAI API Key**: Required for AI-powered documentation generation

## Installation & Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd documentation-generator
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install openai python-dotenv
```

### 3. Set Up OpenAI API Key
Create a `.env` file in the project root:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Run the Extension
1. Open the project folder in VS Code
2. Press `F5` to launch the extension in a new Extension Development Host window
3. The extension will be loaded and ready to use in the new window


## Usage

### Quick Start
1. **Open the Extension**: Press `Ctrl+Alt+D` or click the 📝 Doc Generator icon in the activity bar
2. **Select Documentation Type**: Choose from Internal, External, API, or Technical documentation
3. **Choose Sections**: Check/uncheck the sections you want to include
4. **Generate**: Click "📝 Generate Documentation" to create your docs

### Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `documentationGenerator.generate` | - | Generate new documentation |
| `documentationGenerator.checkDifference` | - | Compare with existing documentation |
| `documentationGenerator.previewMarkdown` | - | Preview generated markdown |
| `documentationGenerator.openDocGenView` | `Ctrl+Alt+D` | Open the documentation generator panel |

### Documentation Types

- **Internal Documentation**: For team members and developers
- **External Documentation**: For end users and stakeholders  
- **API Documentation**: Focused on API endpoints and usage
- **Technical Guide**: In-depth technical implementation details

### Available Sections

- **Introduction**: Project overview and purpose
- **Installation**: Setup and installation instructions
- **API Reference**: Function and class documentation
- **Technologies Used**: Tech stack and dependencies
- **Examples**: Code examples and usage patterns
- **Troubleshooting**: Common issues and solutions
- **License**: License information

## Project Structure

```
documentation-generator/
├── extension.js                 # Main extension entry point
├── package.json                # Extension manifest and dependencies
├── src/
│   ├── commands/               # VS Code command implementations
│   │   ├── generateDocs.js     # Main documentation generation
│   │   ├── checkDifference.js  # Difference checking
│   │   ├── previewMarkdown.js  # Markdown preview
│   │   └── reviewMarkdownFile.js # File review workflow
│   ├── core/                   # Python backend scripts
│   │   ├── main.py            # Main Python orchestrator
│   │   ├── ai.py              # OpenAI integration
│   │   └── doc_generator.py   # Code parsing and analysis
│   ├── providers/              # VS Code providers
│   │   └── DocumentationProvider.js # Tree data provider
│   ├── utils/                  # Utility functions
│   │   ├── constants.js       # Extension constants
│   │   └── utils.js           # Helper utilities
│   └── validation/             # Markdown validation
│       ├── diagnostics.js     # Linting and diagnostics
│       └── quickFixes.js      # Quick fix implementations
└── node_modules/              # Node.js dependencies
```

## Configuration

### generate.json
The extension creates a `generate.json` file in your workspace root to store configuration:

```json
{
    "documentationType": "Internal Documentation",
    "sections": [
        "Introduction",
        "API Reference",
        "Technologies Used"
    ]
}
```

### Customization
- **Add Documentation Types**: Use the "➕ Add Documentation Type" button
- **Add Sections**: Use the "➕ Add Section" button  
- **Modify Defaults**: Edit `src/providers/DocumentationProvider.js`

## Python Backend

The extension uses Python scripts for code analysis and AI integration:

### Core Scripts
- **`main.py`**: Orchestrates the documentation generation process
- **`doc_generator.py`**: Parses codebase and extracts definitions
- **`ai.py`**: Handles OpenAI API communication and prompt engineering

### Supported File Types
- Python (`.py`) - Full AST parsing with docstrings
- JavaScript/TypeScript (`.js`, `.ts`) - Function and class extraction
- Java (`.java`) - Class and method parsing
- Ruby (`.rb`) - Function and class extraction
- Go (`.go`) - Function and struct parsing
- C/C++ (`.c`, `.cpp`) - Function and class extraction
- C# (`.cs`) - Class and method parsing

## Features in Detail

### Code Analysis
- **AST Parsing**: Uses Python's Abstract Syntax Tree for accurate Python code analysis
- **Regex Fallback**: Generic parsing for other languages using regex patterns
- **Import Detection**: Extracts and documents all imports and dependencies
- **Function Analysis**: Captures function signatures, parameters, and docstrings
- **Class Analysis**: Documents class definitions and their methods

### AI Integration
- **Smart Prompting**: Dynamic prompts based on selected documentation type and sections
- **Context Awareness**: Includes codebase structure, git history, and project metadata
- **Markdown Compliance**: Ensures generated documentation follows markdownlint rules
- **Section Customization**: AI adapts content based on selected sections

### Validation & Quality
- **Markdown Linting**: Built-in markdownlint integration with real-time diagnostics
- **Quick Fixes**: Automatic fixes for common markdown issues
- **Preview Mode**: Live preview of generated documentation
- **Difference Detection**: Compare new documentation with existing files

## Troubleshooting

### Common Issues

**"OpenAI API key not found"**
- Ensure your `.env` file exists in the project root
- Verify the API key is correctly formatted: `OPENAI_API_KEY=sk-...`

**"No generated Markdown file found"**
- Check that your workspace contains supported file types
- Ensure Python dependencies are installed
- Check the output channel for detailed error messages

**"Please open a folder in your workspace first"**
- Open a folder in VS Code before using the extension
- Use File → Open Folder to select your project directory

**Extension not loading**
- Ensure VS Code version is 1.80.0 or higher
- Check that all Node.js dependencies are installed
- Reload VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")

### Debug Mode
Enable debug mode by opening the Developer Console:
1. Press `Ctrl+Shift+P`
2. Type "Developer: Toggle Developer Tools"
3. Check the Console tab for detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup
```bash
# Install development dependencies
npm install

# Run tests
npm test

# Package extension
vsce package
```


## Acknowledgments

- OpenAI for providing the GPT-4o-mini API
- VS Code team for the excellent extension API
- The markdownlint community for markdown validation tools

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the VS Code output channel for detailed error messages

---

**Happy Documenting!**
