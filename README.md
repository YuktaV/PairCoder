# PairCoder

A Model Context Protocol server for efficient AI-assisted development.

## Overview

PairCoder (`pc`) is a tool designed to optimize workflows between developers and AI assistants like Claude by intelligently managing project context, tracking changes, and providing just the right amount of information when needed.

## Key Features

- **Module-Based Context Management**: Focus on specific parts of your project
- **Smart Code Summarization**: Multiple levels of detail for efficient token usage
- **Version Tracking**: Capture and restore project states
- **Structured Communication**: Templates for effective AI collaboration
- **Token Optimization**: Minimize token usage while maximizing information
- **Claude Integration**: MCP server for direct integration with Claude

## Installation

```bash
npm install -g paircoder
# or
npx paircoder init
```

## Quick Start

```bash
# Initialize in project folder
pc init

# Define module boundaries
pc module add auth src/auth

# Generate context
pc generate

# Focus on specific module
pc focus auth

# Start MCP server for Claude integration
pc serve
```

## Documentation

See the `docs` folder for detailed documentation and use cases.

For Claude integration, see [CLAUDE_INTEGRATION.md](docs/CLAUDE_INTEGRATION.md).

## Development and Testing

### Running Tests

We've provided a helper script to make it easier to run specific test groups:

```bash
# Run all tests known to pass
node run-tests.js working

# Run tests with some passing and some failing tests
node run-tests.js partial

# Run specific test patterns
node run-tests.js focus prompt passing
```

For more detailed information, see [TESTING_GUIDE.md](TESTING_GUIDE.md).

### Contributing

We welcome contributions! Please see our [development guidelines](docs/DEVELOPMENT.md) for more information.
