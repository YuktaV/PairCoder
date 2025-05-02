# PairCoder Documentation

## Overview

PairCoder is a powerful Model Context Protocol (MCP) server designed to enable efficient AI-assisted development. It provides a standardized way for AI assistants like Claude to access and understand your codebase, offering context-aware assistance during development.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Development](#development)
9. [Testing](#testing)
10. [Contributing](#contributing)

## System Requirements

- Node.js >= 14.0.0
- NPM or Yarn package manager
- Compatible with macOS, Windows, and Linux

## Architecture

PairCoder follows a modular architecture with the following main components:

```
src/
├── cli/          # Command-line interface implementation
├── core/         # Core functionality and business logic
├── context/      # Context generation and management
├── modules/      # Modular components and extensions
├── prompt/       # AI prompt templates and handlers
├── scanner/      # Code scanning and analysis
├── server/       # MCP server implementation
├── storage/      # Data persistence and caching
├── utils/        # Utility functions and helpers
└── version/      # Version management
```

## Core Components

### 1. MCP Server
- Implements the Model Context Protocol
- Handles communication between AI assistants and the codebase
- Provides JSON-RPC formatted responses

### 2. Context Generator
- Analyzes project structure
- Generates contextual information about the codebase
- Maintains up-to-date context as code changes

### 3. Module System
- Allows organization of code into logical modules
- Supports custom module definitions
- Enables focused context generation

### 4. CLI Interface
- Provides command-line tools for initialization
- Supports project management commands
- Offers configuration utilities

## Installation

### Global Installation (Recommended)
```bash
npm install -g paircoder
```

### Project-specific Installation
```bash
npm install paircoder --save-dev
```

## Configuration

### Basic Configuration
Create a configuration file in your project root:

```json
{
  "projectName": "your-project",
  "excludePatterns": ["node_modules/**", "dist/**"],
  "modules": {
    "core": "src/core",
    "api": "src/api"
  }
}
```

### MCP Server Configuration
Configure Claude Desktop to use PairCoder:

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

## Usage

### Basic Commands

1. Initialize a new project:
```bash
paircoder init
```

2. Add a module:
```bash
paircoder module add <name> <path>
```

3. Generate context:
```bash
paircoder generate
```

4. Start MCP server:
```bash
paircoder mcp
```

### Advanced Usage

1. Auto-detection mode:
```bash
paircoder-auto
```

2. Custom port and host:
```bash
paircoder mcp --port 3000 --host localhost
```

3. Debug mode:
```bash
paircoder mcp --debug
```

## API Reference

### MCP Protocol Endpoints

- `GET /health` - Server health check
- `POST /initialize` - Initialize context
- `POST /query` - Query context
- `POST /update` - Update context

### Context API

- `GET /context` - Get current context
- `POST /context/regenerate` - Regenerate context
- `GET /context/modules` - List modules

## Development

### Setting Up Development Environment

1. Clone the repository:
```bash
git clone https://github.com/YuktaV/paircoder.git
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

### Project Structure

- `bin/` - Executable scripts
- `src/` - Source code
- `templates/` - Template files
- `tests/` - Test files
- `docs/` - Documentation

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- <test-file>

# Run tests with coverage
npm run test:coverage

# Update test snapshots
npm run test:update-snapshots
```

### Test Types

1. Unit Tests
2. Integration Tests
3. Visual Tests
4. Snapshot Tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: [https://github.com/YuktaV/paircoder/issues](https://github.com/YuktaV/paircoder/issues)
- Email: vasanthan.m [at] icloud.com

## Version History

See CHANGELOG.md for detailed version history and changes. 