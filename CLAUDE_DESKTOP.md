# Using PairCoder as an MCP Server with Claude Desktop

This guide explains how to use PairCoder as a Model Context Protocol (MCP) server with Claude Desktop, allowing Claude to understand and provide context-aware assistance for your codebase.

> 🚀 **New Feature**: PairCoder now includes a dedicated MCP server command optimized for Claude Desktop integration!
>
> 💡 **Smart Auto-Detection**: PairCoder can now automatically detect and use your current project directory!

## What is Model Context Protocol (MCP)?

Model Context Protocol (MCP) is a standardized way for AI assistants like Claude to access external information and interact with tools. By using PairCoder as an MCP server, Claude Desktop can understand your codebase and provide more accurate, contextual assistance.

## Quick Setup

### Step 1: Install PairCoder

```bash
# Install globally (recommended)
npm install -g paircoder

# Or use with npx
npx paircoder
```

### Step 2: Configure Claude Desktop

Add PairCoder to your Claude Desktop MCP servers configuration. The configuration file is typically located at:

- **macOS**: `~/Library/Application Support/Claude/config.json`
- **Windows**: `%APPDATA%\Claude\config.json`
- **Linux**: `~/.config/Claude/config.json`

#### Option 1: Auto-Detect Project Directory (Recommended)

This approach automatically uses your current working directory, so Claude will have context for whatever project you're currently working on:

```json
{
  "mcpServers": {
    "paircoder": {
      "command": "npx",
      "args": [
        "paircoder-auto"
      ]
    },
    // Other existing MCP servers...
  }
}
```

#### Option 2: Specify a Fixed Project Directory

If you prefer to always use a specific project directory:

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
    },
    // Other existing MCP servers...
  }
}
```

Replace `${YOUR_PROJECT_DIRECTORY}` with the absolute path to your project.

### Step 3: Restart Claude Desktop

After saving the configuration, restart Claude Desktop to apply the changes.

## Usage

Once configured, Claude Desktop will automatically:

1. Start the PairCoder MCP server when needed
2. Initialize PairCoder in your project directory if it's not already initialized
3. Generate context for your codebase
4. Provide context-aware responses when you ask questions about your code

You can ask Claude questions like:

- "Can you explain how the authentication system works in this codebase?"
- "What does the `UserService` class do?"
- "How are API routes organized in this project?"

## Advanced Configuration

### Manual Project Setup (Optional)

For more control over PairCoder's configuration, you can manually initialize it before connecting to Claude Desktop:

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize PairCoder
npx paircoder init

# Define custom modules
npx paircoder module add auth src/auth
npx paircoder module add api src/api

# Generate context
npx paircoder generate
```

### Command-Line Options

When using PairCoder as an MCP server, you can specify various options:

```json
{
  "mcpServers": {
    "paircoder": {
      "command": "npx",
      "args": [
        "paircoder",
        "mcp",
        "--project-dir", "/path/to/your/project",
        "--port", "3000",
        "--host", "localhost",
        "--debug"
      ]
    }
  }
}
```

| Option | Description |
|--------|-------------|
| `--project-dir` | The project directory to serve |
| `--port` | Port to listen on (default: 3000) |
| `--host` | Host to bind to (default: localhost) |
| `--debug` | Enable debug mode |

## Troubleshooting

### PairCoder doesn't initialize correctly

Try manually initializing PairCoder in your project directory:

```bash
cd /path/to/your/project
npx paircoder init --force
npx paircoder generate
```

### Claude Desktop can't connect to PairCoder

1. Check if the MCP server is running by visiting `http://localhost:3000/health` in your browser
2. Ensure your Claude Desktop configuration is correct
3. Try restarting Claude Desktop
4. Check the Claude Desktop logs for any error messages

### Context is not accurate or up-to-date

Regenerate the context after making significant changes to your codebase:

```bash
cd /path/to/your/project
npx paircoder generate --force
```

## Best Practices

1. **Organize your code into modules**: Use `npx paircoder module add` to define logical parts of your codebase
2. **Exclude irrelevant files**: Add patterns to exclude files that don't need to be analyzed
3. **Regenerate context regularly**: After making significant changes to your codebase
4. **Be specific in your questions**: When asking Claude about your code, be specific about which part you're interested in

## For Multiple Projects

### Option 1: Auto-Detect (Recommended)

With the auto-detect option, PairCoder automatically serves context from your current working directory. This means you don't need separate configurations for different projects - Claude will just use whatever project you're currently in.

Configure Claude Desktop to use the auto-detect feature:

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

Then to switch projects, just open a new terminal window in a different project directory before asking Claude questions about that project.

### Option 2: Multiple Fixed Projects

If you prefer to have dedicated configurations for different projects:

```json
{
  "mcpServers": {
    "paircoder-project1": {
      "command": "npx",
      "args": [
        "paircoder",
        "mcp",
        "--project-dir", "/path/to/project1"
      ]
    },
    "paircoder-project2": {
      "command": "npx",
      "args": [
        "paircoder",
        "mcp",
        "--project-dir", "/path/to/project2"
      ]
    }
  }
}
```

This allows you to switch between different projects in your Claude Desktop interface.

## MCP Protocol Compliance

PairCoder's MCP server has been updated to properly implement the Model Context Protocol, ensuring compatibility with Claude Desktop and other MCP clients. The server automatically:

- Handles initialization and context generation
- Responds with proper JSON-RPC formatted messages
- Provides graceful error handling
- Works without requiring user interaction

## Next Steps

- Check out the [Claude API Integration Guide](./CLAUDE_INTEGRATION.md) for using PairCoder with the Claude API
- Learn about [managing modules](./README.md) to better organize your codebase
- Explore [advanced context generation options](./README.md#context-generation-strategies) for more control
