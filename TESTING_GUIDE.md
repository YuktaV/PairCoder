# PairCoder CLI Testing Guide

This document provides guidance on how to run and debug tests for the PairCoder CLI.

## Test Structure

The tests are organized into:

- **Unit tests**: Testing individual components
- **Integration tests**: Testing multiple components working together
- **Snapshot tests**: Verifying CLI output against saved snapshots

## Running Tests

We've provided a helper script `run-tests.js` to make it easier to run specific groups of tests.

### Running Working Tests

To run only the tests that are known to pass:

```bash
node run-tests.js working
```

This will run tests in:
- `tests/config.test.js`
- `tests/snapshot.test.js`

### Running Partially Working Tests

To run tests that have some passing and some failing tests:

```bash
node run-tests.js partial
```

This will run tests in:
- `tests/prompt.test.js`
- `tests/exclude.test.js`

### Running Failing Tests

To run tests that are currently failing and need fixes:

```bash
node run-tests.js failing
```

This will run tests in:
- `tests/export.test.js`
- `tests/integration/command-chains.test.js`

### Running All Tests

To run all tests:

```bash
node run-tests.js all
```

### Running Focused Tests

To focus on specific tests for debugging:

```bash
node run-tests.js focus prompt passing
node run-tests.js focus prompt failing
node run-tests.js focus exclude passing
node run-tests.js focus exclude failing
```

### Updating Snapshots

If you need to update snapshots:

```bash
node run-tests.js working --update-snapshots
```

## Known Issues

1. **Mock Issues**: Some tests fail because mocks for `inquirer.prompt` and other functions aren't being properly registered.

2. **Missing Commands**: Integration tests fail because some CLI commands (scan, create) aren't properly implemented or registered.

3. **Missing Implementations**: Some required methods like `configManager.getAllValues` are missing.

4. **Process Exit Handling**: The export command tests are throwing errors because of `process.exit` calls.

## Next Steps for Improving Tests

1. Complete implementation of the missing functions and commands
2. Update mocks to properly handle scenarios being tested
3. Fix CLI command path issues in integration tests
4. Update snapshots to match current implementation
