# Guide to Fixing Failing Tests in PairCoder

This document outlines the specific issues with failing tests and suggests approaches to fix them.

## Common Issues and Solutions

### 1. Mock Implementation Issues

#### Problem:
Tests are failing because mock implementations aren't being called or registered correctly, particularly with `inquirer.prompt` and related functions.

#### Suggested Fix:
Replace global mocks with localized mocks in the test files:

```javascript
// Instead of global mock in setup.js
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

// Use direct mock in the individual test
it('should prompt for template when none provided', async () => {
  // Override inquirer.prompt specifically for this test
  inquirer.prompt = jest.fn().mockResolvedValue({ selectedTemplate: 'mock-template' });
  
  // Create a spy for configManager.setValue
  const setValueSpy = jest.spyOn(configManager, 'setValue');
  
  await promptCmd('set-default');
  
  expect(inquirer.prompt).toHaveBeenCalled();
  expect(setValueSpy).toHaveBeenCalled();
});
```

### 2. Missing CLI Commands

#### Problem:
Integration tests are failing because commands like 'scan' and 'create' are missing or not properly registered.

#### Suggested Fix:
Implement the missing commands in the CLI or update the commander configuration:

```javascript
// In bin/paircoder or pc.js
const { scanCmd } = require('../src/cli/commands/scan');

// Add the scan command
program
  .command('scan')
  .description('Scan the project for files')
  .option('-j, --json', 'Output in JSON format')
  .action(scanCmd);
```

### 3. Missing Implementation Functions

#### Problem:
Tests expect functions like `configManager.getAllValues` which are not implemented.

#### Suggested Fix:
Add the missing implementations:

```javascript
// In src/core/config.js
const getAllValues = async () => {
  try {
    const config = await readConfig();
    return config;
  } catch (error) {
    throw new Error(`Failed to get configuration: ${error.message}`);
  }
};

// Add to exports
module.exports = {
  // existing exports
  getAllValues
};
```

### 4. Process Exit Handling

#### Problem:
The export command tests are throwing errors because of `process.exit` calls.

#### Suggested Fix:
Modify the code to avoid direct process.exit calls in testable code:

```javascript
// Change this:
if (error) {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
}

// To this:
if (error) {
  console.error(chalk.red('Error:'), error.message);
  return { success: false, error: error.message };
}
```

## Specific Test Fixes

### prompt.test.js

1. Fix for "should prompt for template when none provided" - already implemented with improved mock approach
2. Fix for "should prompt for template name when not provided" - similar approach needed
3. Fix for "should default to default template when none specified" - needs mocking of `promptEngine.generatePrompt`

### exclude.test.js

1. Fix for "should remove exclusion with provided pattern" - needs proper mock of `scannerConfig.removeExclusion`
2. Fix for "should handle case with no exclusions" - needs to correctly handle empty array response

### export.test.js

1. Most failures due to `process.exit` calls - refactor the export.js command module first

### integration/command-chains.test.js

1. Needs implementation of missing CLI commands
2. May need to mock some external dependencies
