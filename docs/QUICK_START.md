# PairCoder Quick Start Guide

This guide will help you get up and running with PairCoder in minutes, optimizing your workflow with Claude.

## Installation

```bash
# Global installation
npm install -g paircoder

# Or use directly with npx
npx paircoder init
```

## 5-Minute Setup

### 1. Initialize PairCoder

Navigate to your project root and initialize:

```bash
cd /path/to/your/project
pc init
```

This scans your project, creates a `.pc` directory, and sets up initial configuration.

### 2. Define Modules

Let PairCoder automatically detect modules:

```bash
pc module detect
```

Or manually define key modules:

```bash
pc module add auth src/auth
pc module add api src/api
```

### 3. Generate Context

Create the initial context representations:

```bash
pc generate
```

### 4. Start Using with Claude

Export context and start working with Claude:

```bash
pc export --level=high
```

Copy the output and paste it into your conversation with Claude.

## Common Workflows

### Bug Fixing

```bash
# Focus on relevant module
pc focus auth

# Create issue report
pc prompt issue "User login fails on Firefox"

# Export detailed context
pc export auth --level=medium
```

### Feature Development

```bash
# Save current version
pc version save before-feature

# Define what you're building
pc prompt feature "Add social login"

# Focus on relevant module
pc focus auth --level=medium
```

### Code Review

```bash
# Generate code review context
pc prompt review src/auth/login.js

# Export focused context
pc export auth --focus login.js
```

### Understanding Code

```bash
# Get explanation template
pc prompt explain src/complex-module.js

# Generate detailed context
pc export complex-module --level=low
```

## Daily Usage Tips

### Update After Changes

After making code changes:

```bash
pc update
```

### Switch Focus

When moving between parts of your project:

```bash
pc focus new-module
```

### Track Decisions

Record important decisions in the journal:

```bash
pc journal add "Decided to use JWT for authentication"
```

### Check What Changed

See what's changed since your last conversation:

```bash
pc diff --since yesterday
```

### Version Snapshots

Create versions at meaningful points:

```bash
pc version save milestone-name "Description of what's done"
```

## Optimizing for Claude

### Token Efficiency

For large projects, use the high-level summary:

```bash
pc export --level=high
```

For specific issues, focus on relevant modules:

```bash
pc export auth --focus login.js
```

### Progressive Detail

Start conversations with high-level context, then add detail as needed:

```bash
# Initial context
pc export --level=high

# Later, when focusing on specific area
pc export auth --level=medium
```

### Module-Focused Work

When working on a specific feature:

```bash
pc focus feature-module
pc export --tokens 3000
```

## Next Steps

Once you're comfortable with the basics:

1. Create custom templates for your common tasks
2. Set up module dependencies for better context
3. Integrate with your Git workflow
4. Explore token optimization techniques

For more detailed information, see the full [Usage Documentation](USAGE.md).
