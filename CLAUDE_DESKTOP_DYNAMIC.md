# Dynamic Path Detection for PairCoder with Claude Desktop

This guide explains how to use PairCoder's new dynamic path detection feature to enable seamless interaction with Claude Desktop, regardless of which project directory you're working with.

## What is Dynamic Path Detection?

PairCoder's dynamic path detection allows Claude to automatically:

1. Detect the appropriate project directory from any path provided
2. Initialize PairCoder if it's not already set up
3. Generate context for the current project
4. Serve project context to Claude through the Model Context Protocol (MCP)

This means you can work with multiple projects without manually configuring PairCoder for each one.

## Quick Setup

### Step 1: Configure Claude Desktop

Add PairCoder's dynamic MCP server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "paircoder": {
      "command": "npx",
      "args": [
        "paircoder-auto"
      ]
    }
  }
}
```

### Step 2: Use Claude with Any Project

With dynamic path detection enabled, you can:

1. Navigate to any project directory in your terminal
2. Start a conversation with Claude Desktop
3. Ask questions about your codebase

PairCoder will automatically:
- Detect the project directory
- Initialize PairCoder if needed
- Generate context for your code
- Make that context available to Claude

## How It Works

The dynamic path detection system uses a sophisticated search algorithm to:

1. Check if the current directory is a PairCoder project
2. If not, search parent directories for PairCoder configuration
3. If still not found, initialize PairCoder in the current directory
4. Create the necessary configuration for proper MCP communication

This allows Claude to seamlessly provide context-aware assistance for any project without requiring manual setup.

## Command-line Options

When using the `paircoder-auto` command, you can specify:

```bash
npx paircoder-auto --path="/path/to/your/project" --port=3000 --debug
```

| Option | Description |
|--------|-------------|
| `--path` | Explicitly specify a project path (otherwise auto-detected) |
| `--port` | Port to listen on (default: 3000) |
| `--host` | Host to bind to (default: localhost) |
| `--debug` | Enable debug logging |

## Troubleshooting

If Claude isn't recognizing your project context:

1. **Verify project detection**: Run `npx paircoder-auto --debug` to see which directory is being detected
2. **Check initialization**: If your project isn't being initialized, try `pc init` in your project directory first
3. **Restart Claude Desktop**: After changes to your project or configuration
4. **Check logs**: Look for any error messages in the MCP server output

## Best Practices

For optimal results with dynamic path detection:

1. **Start in your project root**: Make sure your terminal is in the root directory of your project
2. **Organize your code**: Well-structured codebases generate better context
3. **Be specific in questions**: Reference specific files or components in your queries to Claude
4. **Use standard project structures**: Conventional project layouts are more easily detected

## Advanced Usage

### Multiple Projects in One Session

You can switch between projects by simply telling Claude which directory you're working in:

"I'm now working in `/Users/username/projects/my-new-project`. Can you help me understand the authentication system?"

Claude will process this path and the dynamic MCP server will automatically adjust to provide context for the new project.

### Custom Module Definitions

If you've defined custom modules in your PairCoder configuration, Claude will automatically use them when analyzing your codebase:

"Tell me about the 'auth' module in my project."

## Security Considerations

- PairCoder only accesses files within the detected project directory
- No data is sent outside your local environment
- All communication happens locally between Claude Desktop and the MCP server
