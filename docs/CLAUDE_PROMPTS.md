# Claude Prompts for PairCoder Development

This document contains structured prompts to use with Claude when continuing development of the PairCoder project. These prompts are designed to efficiently provide context and continue development across multiple sessions.

## Initial Project Loading

```
I'm working on the PairCoder project, a Model Context Protocol server tool for optimizing workflow between developers and AI assistants like you. The project is structured to efficiently manage context when working on large codebases.

To continue our development work, here's the current state:

[PROJECT_STAGE]: {early development/implementation/testing}
[CURRENT_FOCUS]: {specific component or feature}
[LAST_COMPLETED]: {last milestone or feature completed}

Please help me continue development on {specific component or task}.
```

## Component Development

### CLI Component

```
I'm implementing the CLI component for PairCoder. This component needs to:
1. Process user commands via the `pc` command
2. Handle various subcommands (init, module, focus, etc.)
3. Provide helpful error messages and documentation

Here's the current file structure:
- src/cli/index.js (main entry point)
- src/cli/commands/*.js (individual command implementations)

Let's work on implementing the {specific command} functionality, which should:
- {requirement 1}
- {requirement 2}
- {requirement 3}
```

### Project Scanner

```
I'm working on the Project Scanner component for PairCoder. This component needs to:
1. Traverse the file system efficiently (excluding node_modules, etc.)
2. Detect technologies and frameworks
3. Identify potential module boundaries
4. Generate metadata about the project structure

The current implementation is:
{current implementation or starting point}

Let's focus on {specific scanning function}, which should {desired behavior}.
```

### Context Generator

```
I'm developing the Context Generator component for PairCoder. This component:
1. Creates multi-level summaries of code (high, medium, low detail)
2. Optimizes for token efficiency
3. Generates different views based on user needs

Current approach:
{current approach or starting point}

I need help with {specific challenge or feature}, specifically:
{detailed requirements}
```

### Prompt Templates

```
I'm designing prompt templates for PairCoder to help developers communicate effectively with Claude. These templates should:
1. Structure information efficiently
2. Include relevant context at the right level of detail
3. Clearly communicate the developer's needs

Let's work on the {specific template type} template, which should help developers:
{template purpose and requirements}
```

## Implementation Challenges

### Token Optimization

```
I'm working on token optimization for PairCoder. The goal is to maximize the information/token ratio in the context provided to Claude.

Current approaches being considered:
1. {approach 1}
2. {approach 2}
3. {approach 3}

Let's focus on {specific optimization challenge}, considering:
- Maximum context retention
- Minimal token usage
- Readability for both AI and humans
```

### Module Detection

```
I'm implementing automatic module detection for PairCoder. The system should:
1. Identify logical boundaries in a codebase
2. Detect dependencies between modules
3. Suggest an efficient module structure

Current detection approach:
{current approach or algorithms}

Help me improve the detection algorithm to handle {specific edge case or framework}.
```

### Versioning System

```
I'm developing the versioning system for PairCoder. It needs to:
1. Capture project states efficiently
2. Allow restoration of previous states
3. Integrate optionally with Git
4. Track changes at the module level

Current design:
{current design or implementation}

Let's work on the {specific versioning feature}, focusing on {particular aspects}.
```

## Integration Scenarios

### Npm Package Setup

```
I'm setting up the npm package configuration for PairCoder. The package should:
1. Be installable globally (pc command)
2. Work with npx for one-off usage
3. Have the right dependencies and configuration

Current package.json:
{current package.json content}

Help me finalize the {specific packaging aspect}.
```

### Testing Framework

```
I'm setting up testing for PairCoder. The testing framework should:
1. Test CLI functionality
2. Validate context generation
3. Ensure module detection works correctly
4. Confirm token optimization is effective

Current testing approach:
{current testing setup}

Let's implement tests for {specific component}.
```

## Continuation Prompts

### Resuming Development

```
We were previously working on the PairCoder project, specifically on the {component} component. We had implemented:
1. {feature 1}
2. {feature 2}
3. {feature 3}

And we were in the middle of developing {current feature}.

Let's continue where we left off, focusing on {next steps}.
```

### Reviewing Implementation

```
I've implemented the {component} for PairCoder with the following approach:

{implementation details}

Please review this implementation, considering:
1. Code quality and best practices
2. Potential edge cases
3. Performance considerations
4. Integration with other components
```

### Debugging Issues

```
I'm encountering an issue with the {component} in PairCoder:

Error or unexpected behavior:
{detailed description of the issue}

Current implementation:
{relevant code}

Expected behavior:
{what should happen}

Help me diagnose and fix this issue.
```

## Final Integration

```
I'm working on finalizing the integration between all PairCoder components:
- CLI Interface
- Project Scanner
- Module Manager
- Context Generator
- Version Controller
- Storage Manager
- Prompt Engine

Current integration approach:
{current approach}

Let's focus on ensuring {specific integration concern}.
```

## Using These Prompts

1. Copy the appropriate prompt template
2. Fill in the bracketed sections with current information
3. Add any relevant code snippets or additional context
4. Send to Claude to continue development

These prompts are designed to provide just enough context for Claude to continue development effectively without wasting tokens on unnecessary information.
