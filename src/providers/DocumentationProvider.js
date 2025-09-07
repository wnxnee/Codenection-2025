const vscode = require('vscode');

// === Tree Item Classes ===
class SectionHeaderItem extends vscode.TreeItem {
    constructor(label, addCommand) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'sectionHeader';
        this.iconPath = new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('textLink.foreground'));
        this.description = addCommand ? 'Add new' : '';
        this.tooltip = addCommand ? 'Click to add a new item to this section' : label;
        if (addCommand) {
            this.command = { command: addCommand, title: 'Add Item' };
        }
        // Enhanced styling
        this.resourceUri = vscode.Uri.parse(`command:${addCommand || ''}`);
    }
}

class RadioItem extends vscode.TreeItem {
    constructor(label, group, isSelected = false) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.group = group;
        this.isSelected = isSelected;
        this.updateIcon();
        this.command = { command: 'documentationGenerator.toggleRadio', title: 'Select Option', arguments: [this] };
        this.tooltip = `Select ${label} as documentation type`;
        this.contextValue = 'radioItem';
    }
    
    updateIcon() { 
        if (this.isSelected) {
            this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('button.background'));
            this.description = 'Selected';
        } else {
            this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('foreground'));
            this.description = '';
        }
    }
    
    setSelected(isSelected) { 
        this.isSelected = isSelected; 
        this.updateIcon(); 
    }
}

class CheckboxItem extends vscode.TreeItem {
    constructor(label, isChecked = false) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.isChecked = isChecked;
        this.updateIcon();
        this.command = { command: 'documentationGenerator.toggleCheckbox', title: 'Toggle Checkbox', arguments: [this] };
        this.tooltip = `Include ${label} section in documentation`;
        this.contextValue = 'checkboxItem';
    }
    
    updateIcon() { 
        if (this.isChecked) {
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('button.background'));
            this.description = 'Included';
        } else {
            this.iconPath = new vscode.ThemeIcon('square', new vscode.ThemeColor('foreground'));
            this.description = '';
        }
    }
    
    toggle() { 
        this.isChecked = !this.isChecked; 
        this.updateIcon(); 
    }
}


class ButtonItem extends vscode.TreeItem {
    constructor(label, commandName, description = '') {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = { command: commandName, title: label };
        this.description = description;
        this.contextValue = 'buttonItem';
    }
}

class StatusItem extends vscode.TreeItem {
    constructor(label, status = 'info') {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'statusItem';
        this.tooltip = '';
        this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('foreground'));
        this.description = 'Info';
    }
}

class LabelItem extends vscode.TreeItem {
    constructor(label) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = undefined;
        this.command = undefined; 
        this.tooltip = '';
        this.iconPath = undefined;
        this.description = '';
    }
}

// === Tree Data Provider ===
class DocumentationProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        
        // Enhanced documentation types with better defaults
        this.docTypes = [
            new RadioItem('Internal Documentation', 'docType', true), 
            new RadioItem('External Documentation', 'docType'),
            new RadioItem('API Documentation', 'docType'),
            new RadioItem('Technical Guide', 'docType')
        ];
        
        // Enhanced sections with better organization
        this.sections = [
            new CheckboxItem('Introduction', true), 
            new CheckboxItem('Installation', false), 
            new CheckboxItem('API Reference', true), 
            new CheckboxItem('Technologies Used', true),
            new CheckboxItem('Examples', false),
            new CheckboxItem('Troubleshooting', false),
            new CheckboxItem('License', false)
        ];
        
        // Status tracking
        this.status = 'ready';
        this.lastGenerated = null;
    }

    getTreeItem(element) { return element; }

    getChildren(element) {
        if (!element) {
            const items = [];
    
            // Status indicator
            items.push(new StatusItem('Documentation Generator Configuration', this.status));
    
            // Spacer
            items.push(new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None));
    
            // Documentation Type Section
            items.push(new SectionHeaderItem('📋 DOCUMENTATION TYPE', 'documentationGenerator.addDocType'));
            items.push(...this.docTypes);
    
            // Spacer
            items.push(new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None));
    
            // Sections Section
            items.push(new SectionHeaderItem('📑 SECTIONS TO INCLUDE', 'documentationGenerator.addSection'));
            items.push(...this.sections);
    
            // Spacer
            items.push(new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None));
    
            // Action Status indicator
            items.push(new StatusItem('Action', this.status));
    
            // Action Buttons
            items.push(
                new ButtonItem('📝 Generate Documentation', 'documentationGenerator.generate', 'Create new documentation', 'primary'),
                new ButtonItem('🔄 Check Differences', 'documentationGenerator.checkDifference', 'Update existing documentation', 'secondary'),
                new ButtonItem('🔍 Preview Markdown', 'documentationGenerator.previewMarkdown', 'Preview generated markdown', 'secondary')
            );
    
            // Spacer
            items.push(new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None));
    
            // Info section (static labels, no hover/click behavior besides default selection highlight)
            items.push(
                new LabelItem('💡 Tips: Select your doc type and sections, then click Generate'),
                new LabelItem('   • Generate Documentation → create a new doc'),
                new LabelItem('   • Check Differences → compare with existing doc'),
                new LabelItem('   • Preview Markdown → see styled preview in VS Code')
            );
    
            // Last generated info
            if (this.lastGenerated) {
                items.push(
                    new vscode.TreeItem('', vscode.TreeItemCollapsibleState.None),
                    new vscode.TreeItem(`📅 Last generated: ${this.lastGenerated}`, vscode.TreeItemCollapsibleState.None)
                );
            }
    
            return items;
        }
        return [];
    }
    

    refresh() { this._onDidChangeTreeData.fire(); }

    toggleRadio(item) {
        if (!item.isSelected) {
            this.docTypes.forEach(radio => radio.setSelected(radio === item));
            this.refresh();
        }
    }

    toggleCheckbox(item) { 
        item.toggle(); 
        this.refresh(); 
    }

    getSelections() {
        const selectedDocType = this.docTypes.find(d => d.isSelected)?.label;
        const selectedSections = this.sections.filter(s => s.isChecked).map(s => s.label);
        return { selectedDocType, selectedSections };
    }

    addDocType(label) {
        if (label && !this.docTypes.some(d => d.label === label)) {
            this.docTypes.push(new RadioItem(`${label}`, 'docType'));
            this.refresh();
        }
    }

    addSection(label) {
        if (label && !this.sections.some(s => s.label === label)) {
            this.sections.push(new CheckboxItem(`${label}`));
            this.refresh();
        }
    }
}


module.exports = { DocumentationProvider };
