# Using PairCoder with Claude

PairCoder can be integrated with Claude through the Model Context Protocol (MCP) server. This allows Claude to access your project files, modules, and context directly.

## Starting the MCP Server

To start the MCP server:

```bash
pc serve
```

By default, the server runs at http://localhost:3000. You can change the port and host using options:

```bash
pc serve --port 8080 --host 0.0.0.0
```

## How It Works

The MCP server provides Claude with contextual information about your project:

1. **Module Discovery**: Claude can see all available modules in your project
2. **Context Generation**: When you select a module, Claude gets a comprehensive overview of the module's structure, files, and purpose
3. **File Access**: Claude can view the contents of specific files when needed

## MCP Server API Endpoints

The server exposes the following endpoints:

- `GET /health` - Health check
- `GET /modules` - List all modules
- `POST /set-module` - Set the current module (body: `{"module": "name"}`)
- `GET /context` - Get context for the current module
- `GET /file?path=path/to/file.js` - Get file content

## Integration with Claude

To integrate with Claude, you need to:

1. Start the MCP server: `pc serve`
2. In your conversation with Claude, inform Claude that you have a PairCoder MCP server running
3. Ask Claude to access your project through the MCP server

Example conversation:

```
You: I have a PairCoder MCP server running at http://localhost:3000. Can you access my project through it?

Claude: I'll connect to your PairCoder MCP server. Let me first check what modules are available.

[Claude connects to your MCP server and lists available modules]

You: Please focus on the "auth" module and help me with its implementation.

[Claude sets the current module to "auth" and retrieves context]
```

## Security Considerations

The MCP server exposes your project files to any service that can connect to it. By default, it only listens on localhost for security reasons. If you need to expose it to other machines:

1. Use the `--host` option to specify an interface
2. Consider using a reverse proxy with authentication
3. Use a firewall to restrict access

## Troubleshooting

If Claude has trouble connecting to your MCP server:

1. Ensure the server is running (`pc serve`)
2. Check if the server is accessible from your machine (`curl http://localhost:3000/health`)
3. Verify that your network allows connections to the server
4. Check the server logs for any errors

Common issues:

- **Empty Context**: If you see "No files found in module path" in the context, check if the module path is correct and accessible
- **Module Not Found**: Ensure the module name is exactly as listed in `/modules` endpoint
- **Access Errors**: Make sure PairCoder has read access to your project files
- **Missing Technology Detection**: Add a `package.json` file to your module for better technology detection
