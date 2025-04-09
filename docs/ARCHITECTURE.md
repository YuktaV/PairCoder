# PairCoder Architecture

## System Overview

PairCoder is designed as a modular system with clear separation of concerns. The architecture focuses on flexibility, efficiency, and extensibility to accommodate different project types and workflows.

```
┌───────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│                   │      │                   │      │                     │
│   CLI Interface   │◄────►│   Core Engine     │◄────►│  Storage Manager    │
│                   │      │                   │      │                     │
└───────────────────┘      └─────────┬─────────┘      └─────────────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │                   │
                           │  Module Manager   │
                           │                   │
                           └───────┬───────────┘
                                   │
          ┌──────────────────┬─────┼─────┬──────────────────┐
          │                  │     │     │                  │
          ▼                  ▼     ▼     ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │ │                 │ │                 │
│ Project Scanner │ │Context Generator│ │Version Controller│ │ Prompt Engine  │
│                 │ │                 │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Core Components

### CLI Interface

Handles all user interaction through the command line.

- **Responsibilities**:
  - Command parsing and validation
  - Help documentation
  - Interactive prompts
  - Output formatting
  - Error handling

- **Key Files**:
  - `src/cli/index.js`: Main CLI entry point
  - `src/cli/commands/*.js`: Individual command implementations
  - `src/cli/helpers/*.js`: CLI utility functions

### Core Engine

Central coordination layer that manages workflow between components.

- **Responsibilities**:
  - Component orchestration
  - Configuration management
  - Event handling
  - Plugin management (future)

- **Key Files**:
  - `src/core/engine.js`: Main engine implementation
  - `src/core/config.js`: Configuration handling
  - `src/core/events.js`: Event system

### Storage Manager

Handles all persistence operations.

- **Responsibilities**:
  - Local file storage (.pc directory)
  - Metadata management
  - Caching
  - Optional cloud sync (future)

- **Key Files**:
  - `src/storage/manager.js`: Storage coordination
  - `src/storage/local.js`: Local file operations
  - `src/storage/cache.js`: Caching logic

### Module Manager

Handles module definitions and boundaries.

- **Responsibilities**:
  - Module detection
  - Boundary management
  - Focus switching
  - Dependency mapping

- **Key Files**:
  - `src/modules/manager.js`: Module handling
  - `src/modules/detector.js`: Automatic module detection
  - `src/modules/dependencies.js`: Dependency analysis

### Project Scanner

Analyzes project structure and composition.

- **Responsibilities**:
  - File system traversal
  - Tech stack detection
  - Framework identification
  - Dependency analysis

- **Key Files**:
  - `src/scanner/index.js`: Main scanner implementation
  - `src/scanner/tech-detector.js`: Technology detection
  - `src/scanner/file-analyzer.js`: File type analysis

### Context Generator

Creates and manages different representations of the codebase.

- **Responsibilities**:
  - Code summarization
  - Token optimization
  - Detail level management
  - Differential updates

- **Key Files**:
  - `src/context/generator.js`: Context generation
  - `src/context/summarizer.js`: Code summarization
  - `src/context/optimizer.js`: Token optimization

### Version Controller

Manages project state and history.

- **Responsibilities**:
  - Snapshot creation
  - Version restoration
  - Timeline management
  - Git integration (optional)

- **Key Files**:
  - `src/version/controller.js`: Version management
  - `src/version/snapshot.js`: Snapshot operations
  - `src/version/git-integration.js`: Git operations

### Prompt Engine

Generates optimized prompts for AI interaction.

- **Responsibilities**:
  - Template management
  - Context formatting
  - Token budgeting
  - Prompt optimization

- **Key Files**:
  - `src/prompt/engine.js`: Prompt generation
  - `src/prompt/templates/*.js`: Prompt templates
  - `src/prompt/formatter.js`: Output formatting

## Data Models

### Configuration (.pcconfig.json)

```json
{
  "project": {
    "name": "my-project",
    "root": "/path/to/project",
    "excludes": ["node_modules", "dist", ".git"]
  },
  "modules": [
    {
      "name": "auth",
      "path": "src/modules/auth",
      "dependencies": ["core", "db"]
    }
  ],
  "context": {
    "defaultLevel": "medium",
    "tokenBudget": 4000
  },
  "versioning": {
    "enabled": true,
    "gitIntegration": false
  }
}
```

### Module Metadata (.pc/modules/auth.json)

```json
{
  "name": "auth",
  "path": "src/modules/auth",
  "files": [
    {
      "path": "src/modules/auth/index.js",
      "type": "JavaScript",
      "size": 1240,
      "lastModified": "2023-10-01T12:34:56Z"
    }
  ],
  "dependencies": ["core", "db"],
  "techStack": ["Node.js", "Express", "JWT"],
  "summary": {
    "high": "Authentication module handling user login, registration, and session management.",
    "medium": "...",
    "low": "..."
  },
  "lastUpdate": "2023-10-01T14:22:33Z"
}
```

### Version Snapshot (.pc/versions/v1.json)

```json
{
  "name": "v1-auth-complete",
  "timestamp": "2023-10-02T15:45:12Z",
  "modules": {
    "auth": {
      "hash": "abc123...",
      "summary": "..."
    }
  },
  "gitCommit": "d3f456...",
  "notes": "Completed basic authentication flows"
}
```

## File Structure

```
paircoder/
├── bin/
│   └── pc.js              # CLI entry point
├── src/
│   ├── cli/               # CLI implementation
│   ├── core/              # Core engine
│   ├── scanner/           # Project scanning
│   ├── modules/           # Module management
│   ├── context/           # Context generation
│   ├── version/           # Version control
│   ├── storage/           # Storage handling
│   ├── prompt/            # Prompt generation
│   └── utils/             # Shared utilities
├── templates/             # Prompt templates
├── docs/                  # Documentation
└── .pc/                   # Generated data (in projects)
    ├── config.json        # Project configuration
    ├── modules/           # Module metadata
    ├── summaries/         # Generated summaries
    ├── versions/          # Version snapshots
    └── journal.md         # Development journal
```

## Extension Points

The architecture includes several extension points for future enhancement:

1. **Plugin System**: Allow third-party plugins to add functionality
2. **Custom Summarizers**: Support different summarization strategies
3. **Cloud Integration**: Enable cloud storage and sharing
4. **IDE Extensions**: Connect with popular IDEs
5. **AI Provider Integration**: Support multiple AI assistants
