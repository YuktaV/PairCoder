# PairCoder Usage Guide

This document provides detailed information on how to use PairCoder to optimize your workflows with AI assistants like Claude.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Core Commands](#core-commands)
- [Module Management](#module-management)
- [Context Generation](#context-generation)
- [Version Control](#version-control)
- [Prompt Engineering](#prompt-engineering)
- [Advanced Usage](#advanced-usage)

## Installation

```bash
# Global installation
npm install -g paircoder

# Or use directly with npx
npx paircoder init
```

## Getting Started

### Initializing a Project

```bash
# Navigate to your project root
cd /path/to/your/project

# Initialize PairCoder
pc init

# This creates a .pc directory with configuration
```

During initialization, PairCoder will:
1. Scan your project structure
2. Detect technology stack
3. Identify potential module boundaries
4. Create initial configuration

### Basic Configuration

The initialization creates a `.pcconfig.json` file with default settings. You can edit this manually or use the configuration commands:

```bash
# Set project name
pc config set project.name "My Awesome Project"

# Add paths to exclude
pc exclude node_modules,dist,.git,build

# Set default context detail level
pc config set context.defaultLevel medium
```

## Core Commands

### Project Scanning

```bash
# Full project scan
pc scan

# Scan a specific directory
pc scan src/components

# Update scan data
pc scan --update
```

### Getting Help

```bash
# General help
pc help

# Command-specific help
pc help module
```

## Module Management

Modules are the key organizational unit in PairCoder, allowing you to focus on specific parts of your project.

### Defining Modules

```bash
# Add a module
pc module add auth src/modules/auth

# Add with description
pc module add payments src/modules/payments "Payment processing system"

# Automatically detect modules
pc module detect
```

### Focusing on Modules

```bash
# Focus on a specific module
pc focus auth

# This generates a focused context for the module
# Output can be copied to Claude

# Clear focus
pc focus clear
```

### Module Dependencies

```bash
# Show module dependencies
pc module deps auth

# Add a dependency
pc module deps auth add core

# Visualize module dependencies
pc module deps --visualize
```

## Context Generation

PairCoder generates different levels of context for efficient token usage.

### Generating Context

```bash
# Generate for all modules
pc generate

# Generate for specific module
pc generate auth

# Specify detail level
pc generate auth --level high|medium|low
```

### Detail Levels

- **High**: Concise overviews focused on purpose and relationships
- **Medium**: Balanced detail with key implementation aspects
- **Low**: Comprehensive details including implementation specifics

Example output differences:

**High**:
```
auth/: Authentication module handling user login, registration and sessions using JWT
```

**Medium**:
```
auth/: Authentication module with:
- login.js: Email/password authentication with rate limiting
- register.js: New user creation with validation
- session.js: JWT token management (issue, validate, refresh)
```

**Low**:
```
auth/: Authentication module
- login.js: Handles user authentication via email/password
  - validateCredentials(): Checks credentials against database
  - generateToken(): Creates new JWT on successful login
  - trackLoginAttempt(): Implements rate limiting logic
- register.js: ...
```

### Exporting Context

```bash
# Export context for Claude
pc export auth

# Export with specific level
pc export auth --level medium

# Export with token budget
pc export auth --tokens 2000
```

## Version Control

PairCoder can track different states of your project for easy reference.

### Creating Versions

```bash
# Save current state
pc version save v1-auth-complete

# Add description
pc version save v1-auth-complete "Completed basic auth flows"

# Save specific modules
pc version save v1-auth-complete auth,core
```

### Managing Versions

```bash
# List versions
pc version list

# Show version details
pc version show v1-auth-complete

# Restore version
pc version restore v1-auth-complete

# Delete version
pc version delete v1-auth-complete
```

### Git Integration

```bash
# Enable Git integration
pc config set versioning.gitIntegration true

# Create version from Git commit
pc version from-commit a1b2c3d

# Link version to commit
pc version link v1-auth-complete a1b2c3d
```

## Prompt Engineering

PairCoder includes templates for effective communication with Claude.

### Using Templates

```bash
# Generate issue description prompt
pc prompt issue "Authentication fails on Firefox"

# Generate feature request prompt
pc prompt feature "Add social login options"

# Generate code review prompt
pc prompt review auth/login.js
```

### Custom Templates

Create custom templates in the `.pc/templates` directory:

```bash
# Create new template
pc template create my-template

# Use custom template
pc prompt my-template "Custom prompt data"
```

## Advanced Usage

### Diff Generation

```bash
# Show changes since last context generation
pc diff

# Show changes since specific date
pc diff --since 2023-10-01

# Show changes in specific module
pc diff auth
```

### Token Optimization

```bash
# Show token usage estimates
pc tokens auth

# Optimize context for token usage
pc export auth --optimize

# Set token budget
pc config set context.tokenBudget 4000
```

### Project Journal

```bash
# Add journal entry
pc journal add "Implemented OAuth flow"

# View journal
pc journal show

# Export journal
pc journal export journal.md
```

### Code Search

```bash
# Search code semantically
pc search "authentication logic"

# Search in specific module
pc search "password reset" auth
```

### Tagging

```bash
# Tag important code sections
pc tag add auth/login.js:validatePassword "Critical security code"

# List tags
pc tag list

# Find tagged sections
pc tag find "security"
```

## Example Workflows

### New Feature Development

```bash
# Focus on relevant module
pc focus auth

# Create new version before changes
pc version save before-social-login

# Make changes to code...

# Update context
pc update auth

# Generate diff for Claude
pc diff auth --since before-social-login

# Save completed version
pc version save with-social-login "Added social login options"
```

### Debugging with Claude

```bash
# Generate issue template
pc prompt issue "Login fails after 3 attempts"

# Export relevant context
pc export auth --focus rate-limiting

# Show recent changes
pc diff auth/login.js

# Document solution
pc journal add "Fixed rate limiting issue by..."
```
