/**
 * Quick test for the MCP server
 */

const { MCPServer } = require('./src/server/mcp');

async function main() {
  try {
    // Initialize and start the server
    // Using port 3001 to avoid conflicts
    const server = new MCPServer({ port: 3001 });
    await server.initialize();
    await server.start();
    
    console.log('Server started, press Ctrl+C to stop');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
