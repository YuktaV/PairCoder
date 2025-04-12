/**
 * Quick test for the Dynamic MCP server
 */

const { DynamicMCPServer } = require('./src/server/dynamic-mcp');

async function main() {
  try {
    // Initialize and start the server
    // Using port 3001 to avoid conflicts
    const server = new DynamicMCPServer({ 
      port: 3001,
      debug: true,
      // Can optionally provide a path
      // userPath: '/path/to/project'
    });
    
    await server.start();
    
    console.log('Dynamic MCP server started, press Ctrl+C to stop');
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down server...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
