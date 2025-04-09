# PairCoder CLI Tests

This directory contains comprehensive tests for the PairCoder CLI commands, including unit tests, integration tests, and snapshot tests.

## Test Structure

### Core Files
- `setup.js` - Contains common test setup, mocks, and utilities
- `config.test.js` - Tests for the `pc config` command
- `exclude.test.js` - Tests for the `pc exclude` command 
- `prompt.test.js` - Tests for the `pc prompt` command
- `export.test.js` - Tests for the `pc export` command
- `snapshot.test.js` - Snapshot tests for command outputs

### Directories
- `helpers/` - Test utilities and assertion helpers
  - `assertions.js` - Helper functions for complex assertions
  - `mocks.js` - Mock project configurations and test fixtures
  - `snapshots.js` - Utilities for snapshot testing
  - `visual-reporter.js` - Custom Jest reporter for better output
- `snapshots/` - Stored output snapshots for comparison
- `integration/` - Multi-command integration tests
  - `command-chains.test.js` - Tests for sequences of commands

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode (useful during development):
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

Run with visual reporting for better output formatting:
```bash
VISUAL_REPORT=true npm test
```

Update snapshots when command output has intentionally changed:
```bash
UPDATE_SNAPSHOTS=true npm test
```

Run only integration tests:
```bash
npm test -- --testPathPattern=integration
```

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate the CLI commands from their dependencies:

1. **Console Output**: `console.log`, `console.error`, and `console.warn` are mocked to capture output for verification.

2. **External Modules**: Modules like `inquirer`, `clipboardy`, and `fs-extra` are mocked to avoid real filesystem operations and user interactions.

3. **Internal Dependencies**: PairCoder core modules are mocked to isolate CLI command testing from other components:
   - `configManager` - Handles configuration storage and retrieval
   - `scannerConfig` - Manages exclusion patterns
   - `promptEngine` - Manages prompt templates and generation
   - `moduleManager` - Manages module metadata
   - `contextGenerator` - Generates and optimizes context

## Test Coverage

The tests aim to cover:

1. **Unit Tests**: Individual command functionality
   - **Happy Paths**: Normal operation with valid inputs
   - **Error Handling**: How commands respond to invalid inputs and errors
   - **Interactive Features**: Prompts and user interaction flows
   - **Edge Cases**: Special scenarios like empty inputs or lists

2. **Integration Tests**: Commands working together
   - **Command Sequences**: Multiple commands running in sequence
   - **State Persistence**: Changes made by one command affecting another
   - **End-to-End Workflows**: Complete user workflows

3. **Snapshot Tests**: Output consistency
   - **Command Output**: Ensuring output format doesn't change unexpectedly
   - **Error Messages**: Consistent error formatting and wording
   - **Help Text**: Documentation consistency

## Adding New Tests

When adding tests for new CLI commands:

1. Create a new test file named `[command-name].test.js`
2. Import the command module and mock its dependencies
3. Follow the existing structure with `describe` and `it` blocks for clear organization
4. Use the global `expectOutputToContain` helper to verify console output

## Useful Patterns

### Basic Output Testing
```javascript
// Legacy approach
expectOutputToContain('Expected text in output');
expectOutputToContain('Error message', 'error'); // For error output

// New approach with more options
assertCliOutput(output, {
  contains: ['Expected text', 'Another expected string'],
  notContains: ['Unwanted text'],
  matches: /^Expected pattern/
});
```

### JSON Output Validation
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

// Or use the matcher in Jest assertions
expect(jsonOutput).toHaveJsonStructure({
  requiredField: 'string',
  // ...
});
```

### Command Result Validation
```javascript
// For command execution results
const result = runCliCommand('config get project.name');

assertCommandResult(result, {
  code: 0,
  success: true,
  output: {
    contains: ['project.name']
  }
});
```

### Snapshot Testing
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

### Mock Projects
```javascript
// Set up a complete mock project environment
await setupMockProject(tempDir, 'reactApp');

// Now run commands against the mock project
const output = runCliCommand('scan', tempDir);
```

### Testing interactions:
```javascript
// Mock inquirer responses before the test
inquirer.prompt.mockResolvedValueOnce({ someChoice: 'selected-value' });

// Then run the command
await someCmd();
```

### Simulating errors:
```javascript
// Make a dependency throw an error
someModule.someMethod.mockRejectedValueOnce(new Error('Test error'));

// Run the command and verify error handling
await someCmd();
assertCliOutput(consoleOutput.error.join('\n'), {
  contains: ['Error message']
});
```
