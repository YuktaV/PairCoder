Overview
PairCoder (pc) is a revolutionary Model Context Protocol (MCP) server designed to optimize workflows between developers and AI assistants like Claude. It intelligently manages project context, tracks changes, and provides precise information extraction.

> 🆕 **New Feature**: PairCoder now includes a dedicated MCP server mode for seamless integration with Claude Desktop! [See the integration guide](./CLAUDE_DESKTOP.md)
>
> 💡 **Smart Auto-Detection**: PairCoder can now automatically detect and serve your current project directory with zero configuration!
Key Features

Intelligent Context Management: Focus on specific project modules
Smart Code Summarization: Generate context at multiple detail levels
Version Tracking: Capture and restore project states
Structured Communication: Standardize AI collaboration
Token Optimization: Minimize token usage while maximizing information
Claude Integration: Seamless AI assistant workflow

Installation
bash# Global installation
npm install -g paircoder

# Or use npx for one-time initialization
npx paircoder init
Quick Start
bash# Initialize in project folder
pc init

# Define module boundaries
pc module add auth src/auth

# Generate context
pc generate

# Focus on specific module
pc focus auth

# Start MCP server for Claude integration
pc serve

# Start as an MCP server for Claude Desktop
npx paircoder mcp

# Auto-detect current project and start MCP server
npx paircoder-auto
Documentation

[Claude Desktop Integration Guide](./CLAUDE_DESKTOP.md)
[Claude API Integration Guide](./CLAUDE_INTEGRATION.md)
[Testing Guide](./TESTING_GUIDE.md)

Requirements

Node.js v16.0.0+
npm v8.0.0+

Configuration
Create a .paircoder.json in your project root:
json{
  "modules": {
    "default": ["src"],
    "custom": {
      "auth": ["src/auth"],
      "api": ["src/api"]
    }
  },
  "generation": {
    "defaultDetail": "standard",
    "tokenLimit": 4000
  }
}
Contributing
We welcome contributions! Please see our contribution guidelines for more information.

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

Testing
bash# Run all passing tests
node run-tests.js working

# Run specific test groups
node run-tests.js focus prompt
License
Distributed under the MIT License. See LICENSE for more information.

Contact
Project Link: https://github.com/YuktaV/paircoder
Email : vasanthan.m [at] icloud.com 