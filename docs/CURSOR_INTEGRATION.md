# PairCoder Integration with Cursor IDE

This guide explains how to set up and use PairCoder as a Model Context Protocol (MCP) server with Cursor IDE, enabling AI-assisted development with context awareness.

## Prerequisites

1. Cursor IDE installed on your system
2. Node.js >= 14.0.0
3. NPM or Yarn package manager

## Installation

### Step 1: Install PairCoder

```bash
# Install globally (recommended)
npm install -g paircoder

# Or install locally in your project
npm install paircoder --save-dev
```

### Step 2: Configure Cursor IDE

1. Open Cursor IDE
2. Go to Settings (⌘, on macOS or Ctrl+, on Windows/Linux)
3. Navigate to the "AI" or "Extensions" section
4. Look for "Model Context Protocol" or "MCP" settings

## Configuration

### Option 1: Auto-Detect Mode (Recommended)

This configuration automatically uses your current project directory:

```json
{
  "mcpServers": {
    "paircoder": {
      "command": "npx",
      "args": ["paircoder-auto"]
    }
  }
}
```

### Option 2: Fixed Project Directory

If you want to use a specific project directory:

```json
{
  "mcpServers": {
    "paircoder": {
      "command": "npx",
      "args": [
        "paircoder",
        "mcp",
        "--project-dir",
        "${YOUR_PROJECT_DIRECTORY}"
      ]
    }
  }
}
```

Replace `${YOUR_PROJECT_DIRECTORY}` with the absolute path to your project.

## Usage

### Initial Setup

1. Open your project in Cursor IDE
2. Initialize PairCoder in your project:
```bash
cd /path/to/your/project
paircoder init
```

3. Start the MCP server:
```bash
paircoder mcp
```

### Using with Cursor IDE

Once configured, Cursor IDE will automatically:

1. Connect to the PairCoder MCP server
2. Use context from your codebase when providing AI assistance
3. Maintain context awareness as you work

You can ask Cursor IDE questions about your codebase, such as:

- "Explain this function's purpose"
- "What are the dependencies of this module?"
- "How does this component interact with others?"

### Advanced Configuration

#### Custom Port and Host

If you need to use a specific port or host:

```bash
paircoder mcp --port 3000 --host localhost
```

#### Debug Mode

Enable debug mode for troubleshooting:

```bash
paircoder mcp --debug
```

## Troubleshooting

### Common Issues

1. **Cursor IDE can't connect to PairCoder**
   - Check if the MCP server is running
   - Verify the port and host settings
   - Ensure Cursor IDE's MCP configuration is correct

2. **Context is not updating**
   - Regenerate context after significant changes:
   ```bash
   paircoder generate --force
   ```

3. **Performance issues**
   - Exclude large directories in configuration:
   ```json
   {
     "excludePatterns": ["node_modules/**", "dist/**", "build/**"]
   }
   ```

### Debugging

1. Check server status:
```bash
curl http://localhost:3000/health
```

2. View current context:
```bash
curl http://localhost:3000/context
```

3. Check logs:
```bash
paircoder mcp --debug
```

## Best Practices

1. **Organize your code into modules**
   ```bash
   paircoder module add auth src/auth
   paircoder module add api src/api
   ```

2. **Regular context updates**
   - Regenerate context after major changes
   - Use `--force` flag when needed

3. **Exclude unnecessary files**
   - Add patterns to exclude in configuration
   - This improves performance and relevance

4. **Use meaningful module names**
   - Clear module names help with context organization
   - Makes it easier to query specific parts of your codebase

## Support

For issues or questions:
- GitHub Issues: [https://github.com/YuktaV/paircoder/issues](https://github.com/YuktaV/paircoder/issues)
- Email: vasanthan.m [at] icloud.com 