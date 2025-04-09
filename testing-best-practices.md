# PairCoder Testing Best Practices

This document outlines the key principles and patterns for writing effective tests in the PairCoder project.

## Dependency Injection Pattern

> **Implementation Update**: We've successfully applied this pattern to the `prompt.js`, `module.js`, and `config.js` commands. See the implementations in `prompt-improved.test.js`, `module-extended.test.js`, and `config-improved.test.js` for reference.

### Why Use Dependency Injection?

1. **Improved Testability**: By injecting dependencies, we can easily mock/stub them for testing
2. **Reduced Coupling**: Components are loosely coupled, making the code more maintainable
3. **Enhanced Flexibility**: Components can work with different implementations of their dependencies
4. **Easier Testing**: Tests can focus on the component's logic without worrying about its dependencies

### Implementation Approach

We've adopted a factory pattern for our CLI commands that follows this structure:

```javascript
// Main function that creates the command with injectable dependencies
function createSomeCommand(deps = {}) {
  // Use provided dependencies or fall back to defaults
  const dependency1 = deps.dependency1 || defaultDependency1;
  const dependency2 = deps.dependency2 || defaultDependency2;
  
  // Command implementation that uses injected dependencies
  function commandFunction(...args) {
    // Logic using dependency1, dependency2
  }
  
  // Return the configured command function
  return { commandFunction };
}

// Create default instance with no dependencies provided (uses defaults)
const { commandFunction } = createSomeCommand();

// Export both the factory and the default instance
module.exports = { 
  commandFunction,
  createSomeCommand 
};
```

### Testing With Dependency Injection

When testing components that use dependency injection:

1. Create mock versions of all dependencies
2. Use the factory function to create the component with mocked dependencies
3. Test the component's behavior using the mock dependencies
4. Verify that the component interacts with its dependencies correctly

Example:

```javascript
// Create mocks for dependencies
const mockDependency1 = { method1: jest.fn() };
const mockDependency2 = { method2: jest.fn() };

// Create component with mock dependencies
const { commandFunction } = createSomeCommand({
  dependency1: mockDependency1,
  dependency2: mockDependency2
});

// Test component behavior
test('should call dependency methods correctly', async () => {
  await commandFunction('arg1', 'arg2');
  expect(mockDependency1.method1).toHaveBeenCalledWith('arg1');
  expect(mockDependency2.method2).toHaveBeenCalledWith('arg2');
});
```

## Console Output Testing

For CLI applications, testing console output is crucial. We use this approach:

1. **Capture Console Output**: Intercept console.log/error/warn calls to capture output
2. **Verify Output Content**: Check that the expected messages appear in the output
3. **Clean Up**: Restore original console functions after testing

Implementation:

```javascript
beforeEach(() => {
  // Set up console output capture
  global.consoleOutput = {
    log: [],
    error: [],
    warn: []
  };
  
  // Mock console methods
  console.log = jest.fn((...args) => {
    global.consoleOutput.log.push(args.join(' '));
  });
  
  console.error = jest.fn((...args) => {
    global.consoleOutput.error.push(args.join(' '));
  });
  
  console.warn = jest.fn((...args) => {
    global.consoleOutput.warn.push(args.join(' '));
  });
});

// Helper function to check output
const expectOutputToContain = (text, outputType = 'log') => {
  const output = global.consoleOutput[outputType];
  const found = output.some(line => line.includes(text));
  if (!found) {
    throw new Error(`Expected "${text}" to be in output, but it wasn't`);
  }
};
```

## Handling Special Test Cases

### Process Exit Handling

When testing functions that call `process.exit()`, mock it to prevent the test from exiting:

```javascript
const originalProcessExit = process.exit;
process.exit = jest.fn();

try {
  // Run test that might call process.exit()
  await functionThatMightExit();
  expect(process.exit).toHaveBeenCalledWith(1);
} finally {
  // Restore process.exit
  process.exit = originalProcessExit;
}
```

### Interactive Prompts

For commands that use interactive prompts (inquirer), mock the prompt function to return predefined answers:

```javascript
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

// In test:
inquirer.prompt.mockResolvedValueOnce({ answer: 'value' });
```

### Difficult-to-Test Edge Cases

Sometimes a direct assertion isn't possible due to implementation details. In these cases:

1. **Skip the test**: Use `it.skip()` with a clear comment explaining why
2. **Test indirectly**: Verify other observable effects of the code
3. **Refactor for testability**: Consider modifying the implementation to make it more testable

## Test Structure Best Practices

1. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
2. **Isolated Tests**: Each test should be independent and not rely on state from other tests
3. **Clear Descriptions**: Use descriptive test and describe blocks to document behavior
4. **Test Negative Cases**: Don't just test the happy path; test error handling and edge cases
5. **Reset Mocks**: Clear mock state between tests using `jest.clearAllMocks()`

## Command Factory Pattern

We've implemented a factory pattern for CLI commands that makes dependency injection and testing more straightforward. This approach has several benefits:

1. **Consistent Interface**: All command modules follow the same structural pattern
2. **Simplified Testing**: Dependencies can be easily mocked in tests
3. **Clear Separation**: Business logic is separated from dependency initialization
4. **Reusability**: Command implementations can be reused with different dependencies

### Implementation Example

The typical structure for a command factory is:

```javascript
// Factory function in command-factory.js
function createCommandFunctions(deps = {}) {
  // Extract dependencies with defaults
  const dependency1 = deps.dependency1 || require('path/to/real/dependency1');
  const dependency2 = deps.dependency2 || require('path/to/real/dependency2');
  
  // Implement command functions using dependencies
  async function commandFunction(arg1, arg2, options) {
    // Implementation using dependencies
  }
  
  // Return object with all command functions
  return { 
    commandFunction,
    // Add other functions as needed
  };
}

module.exports = { createCommandFunctions };
```

Then in the main command file:

```javascript
// Main command.js file
const { createCommandFunctions } = require('./command-factory');

// Create command with default dependencies
const { commandFunction } = createCommandFunctions();

// Export for CLI use
module.exports = { commandFunction };
```

### Testing with the Factory Pattern

When testing, we create the command with mock dependencies:

```javascript
// Test file
const { createCommandFunctions } = require('../src/command-factory');

// Create mock dependencies
const mockDependency1 = { method: jest.fn() };
const mockDependency2 = { otherMethod: jest.fn() };

// Create command with mocks
const { commandFunction } = createCommandFunctions({
  dependency1: mockDependency1,
  dependency2: mockDependency2
});

test('should call dependency methods', async () => {
  await commandFunction('arg1', 'arg2', {});
  expect(mockDependency1.method).toHaveBeenCalled();
});
```

We've applied this pattern to `config.js`, `prompt.js`, and `module.js` commands with excellent results for testability.

## Improving Test Coverage

Current coverage gaps include:

1. **Command Functions**: Some CLI commands lack comprehensive test coverage
2. **Error Handling**: Error paths need better test coverage
3. **Edge Cases**: Special scenarios and corner cases should be tested

Focus on testing:

1. **Public API**: All exported functions should have tests
2. **Error Handling**: Verify that errors are handled correctly
3. **Decision Points**: All branches, conditions, and decision points
4. **Edge Cases**: Boundary conditions and unusual inputs
