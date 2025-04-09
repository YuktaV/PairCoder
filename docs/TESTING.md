# PairCoder Testing Guide

This document provides comprehensive information about the testing infrastructure for the PairCoder CLI. It covers the different types of tests, available testing utilities, and best practices for maintaining and extending the test suite.

## Testing Architecture

PairCoder uses Jest as its testing framework with additional custom utilities and helpers for CLI-specific testing needs. The test suite is organized into:

1. **Unit Tests**: Testing individual components and commands in isolation
2. **Integration Tests**: Testing multiple commands working together
3. **Snapshot Tests**: Ensuring command output format consistency

## Test Directory Structure

```
tests/
├── setup.js                      # Test setup and global utilities
├── *.test.js                     # Unit tests for individual commands
├── snapshot.test.js              # Snapshot tests for command outputs
├── README.md                     # Testing documentation
├── helpers/                      # Test helper utilities
│   ├── assertions.js             # Helper assertions for complex validations
│   ├── mocks.js                  # Mock project setups and fixtures
│   ├── snapshots.js              # Snapshot testing utilities
│   └── visual-reporter.js        # Custom Jest reporter for better output
├── integration/                  # Integration tests
│   └── command-chains.test.js    # Tests for command sequences
└── snapshots/                    # Stored snapshots for comparison
    └── *.snap                    # Snapshot files
```

## Running Tests

PairCoder provides several npm scripts for running different types of tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run with visual reporting (better formatted output)
npm run test:visual

# Run only integration tests
npm run test:integration

# Run snapshot tests
npm run test:snapshot

# Update snapshots when command output has intentionally changed
npm run test:update-snapshots
```

## Test Helpers

### Assertion Helpers

Located in `tests/helpers/assertions.js`, these utilities make it easier to test complex CLI outputs:

#### JSON Structure Validation

```javascript
// Validate structure of JSON output
const result = assertJsonStructure(jsonOutput, {
  requiredField: 'string',
  numericField: 'number',
  optionalField: { optional: true, type: 'string' },
  nestedObject: {
    subField: 'boolean'
  },
  arrayField: ['string'] // Validates first item in array
});

// Or use the Jest matcher
expect(jsonOutput).toHaveJsonStructure({
  requiredField: 'string',
  // ...
});
```

#### CLI Output Validation

```javascript
// Validate CLI text output
assertCliOutput(output, {
  contains: ['Expected text', 'Another expected string'],
  notContains: ['Unwanted text'],
  matches: /^Expected pattern/
});
```

#### Command Result Validation

```javascript
// For command execution results
const result = runCliCommand('config get project.name');

assertCommandResult(result, {
  code: 0, // Exit code
  success: true, // Whether command succeeded
  output: {
    contains: ['project.name'] // Expected output
  }
});
```

### Mock Project Presets

Located in `tests/helpers/mocks.js`, these utilities help create realistic project environments:

```javascript
// Set up a mock project environment
await setupMockProject(tempDir, 'reactApp');

// Available project types: 'basic', 'reactApp', 'nodeApi'

// Create a mock command result
const mockResult = createMockCommandResult({
  code: 0,
  stdout: 'Success output',
  stderr: ''
});
```

### Snapshot Testing

Located in `tests/helpers/snapshots.js`, these utilities help with snapshot management:

```javascript
// Match against stored snapshot
const output = runCliCommand('--help');
expect(output).toMatchCommandSnapshot('help-command-output');

// Or using the function directly
const matches = await matchesSnapshot('snapshot-name', output, {
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
});
expect(matches).toBe(true);
```

## Testing Strategies

### Unit Testing Commands

For testing individual CLI commands:

```javascript
describe('config command', () => {
  beforeEach(() => {
    // Mock dependencies and setup
    jest.clearAllMocks();
    // Set up test environment
  });
  
  it('should display all config when no key is provided', async () => {
    await configCmd('get');
    
    // Verify the expected function was called
    expect(configManager.getAllValues).toHaveBeenCalled();
    
    // Verify console output
    expectOutputToContain('Current PairCoder Configuration');
  });
});
```

### Integration Testing

For testing multiple commands working together:

```javascript
describe('Project initialization and configuration flow', () => {
  beforeEach(async () => {
    // Set up clean test environment
    await fs.emptyDir(TEMP_DIR);
  });

  it('should initialize a project and set a configuration value', () => {
    // Step 1: Initialize project
    const initOutput = runCliCommand('init --name test-project');
    assertCliOutput(initOutput, {
      contains: ['Project initialized successfully']
    });
    
    // Step 2: Update a configuration value
    const configOutput = runCliCommand('config set context.defaultLevel high');
    assertCliOutput(configOutput, {
      contains: ['Configuration updated successfully']
    });
    
    // Verify the actual config file was updated
    const configFile = fs.readJsonSync(path.join(TEMP_DIR, 'paircoder.config.json'));
    expect(configFile.context.defaultLevel).toBe('high');
  });
});
```

### Snapshot Testing

For ensuring output format consistency:

```javascript
describe('Help command snapshots', () => {
  it('should match help command snapshot', async () => {
    const output = runCliCommand('--help');
    
    expect(output).toMatchCommandSnapshot('help-command-output');
  });
});
```

## Best Practices

1. **Isolation**: Ensure tests don't depend on or interfere with each other
2. **Clean Environment**: Set up and tear down test environments properly
3. **Realistic Testing**: Use mock projects that resemble real-world usage
4. **Clear Descriptions**: Write descriptive test names and assertions
5. **Test Organization**: Group related tests into logical describe blocks
6. **Code Coverage**: Aim for high test coverage, especially for critical paths
7. **Error Cases**: Test both success and error scenarios
8. **Update Snapshots Carefully**: Only update snapshots after verifying changes are intentional

## Adding New Tests

When adding new tests:

1. Follow existing patterns and conventions
2. Use the provided helper utilities
3. Consider adding both unit and integration tests
4. Update snapshots when command output changes intentionally
5. Run the full test suite before committing to ensure all tests pass

## Visual Report

When running tests with the visual reporter (`npm run test:visual`), you'll see a more user-friendly output format:

```
🚀 Starting PairCoder CLI Tests

tests/config.test.js
  ✓ should display all config when no key is provided (15ms)
  ✓ should display specific config when key is provided (4ms)
  ✓ should handle errors during retrieval (3ms)
  
tests/integration/command-chains.test.js
  ✓ should initialize a project and set a configuration value (125ms)
  ✓ should create and export files with correct content (95ms)
  
────────────────────────────────────────────────────────────────

Test Summary:
  ✓ 25 tests passed (100.0%)
  ℹ Total time: 1.5s

✨ All tests passed!
```

## Continuous Integration

The test suite is designed to run well in CI environments. Use environment variables to control behavior:

- `VISUAL_REPORT=true`: Enable visual reporting
- `UPDATE_SNAPSHOTS=true`: Update snapshots automatically

## Test Coverage

Coverage reports are generated with `npm run test:coverage` and show code coverage metrics for:

- Statements
- Branches
- Functions
- Lines

The project aims for at least 70% coverage across all categories.
