/**
 * Test Assertion Helpers
 * 
 * This file contains helper functions for making complex assertions in PairCoder tests.
 */

/**
 * Validates that the output is valid JSON and has the expected structure
 * @param {string} output - The command output to validate
 * @param {Object} schema - An object describing the expected structure
 * @returns {Object} The parsed JSON for further assertions
 */
function assertJsonStructure(output, schema) {
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch (error) {
    throw new Error(`Expected valid JSON output but got: ${output}`);
  }

  validateStructure(parsed, schema);
  return parsed; // Return for further assertions if needed
}

/**
 * Recursively validates object structure against schema
 * @private
 */
function validateStructure(obj, schema) {
  if (schema === '*') return; // Wildcard accepts any value

  if (Array.isArray(schema)) {
    expect(obj).toBeInstanceOf(Array);
    if (schema.length > 0 && obj.length > 0) {
      validateStructure(obj[0], schema[0]); // Validate first item against schema
    }
    return;
  }

  if (typeof schema === 'object' && schema !== null) {
    expect(obj).toBeInstanceOf(Object);
    
    // Check required fields exist
    Object.keys(schema).forEach(key => {
      if (!schema[key].optional) {
        expect(obj).toHaveProperty(key);
        if (obj[key] !== null && obj[key] !== undefined) {
          validateStructure(obj[key], schema[key].type || schema[key]);
        }
      }
    });
    return;
  }

  // Type validation
  if (schema === 'string') expect(typeof obj).toBe('string');
  else if (schema === 'number') expect(typeof obj).toBe('number');
  else if (schema === 'boolean') expect(typeof obj).toBe('boolean');
  else if (schema === 'object') expect(typeof obj).toBe('object');
  else if (schema === 'array') expect(Array.isArray(obj)).toBe(true);
}

/**
 * Validates CLI command output against expected patterns
 * @param {string} output - The command output string
 * @param {Object} options - Validation options
 * @param {Array<string>} options.contains - Strings that must be in the output
 * @param {Array<string>} options.notContains - Strings that must NOT be in the output
 * @param {RegExp} options.matches - RegExp that the output must match
 */
function assertCliOutput(output, options = {}) {
  const { contains = [], notContains = [], matches } = options;
  
  // Check for strings that must be present
  contains.forEach(text => {
    expect(output).toContain(text);
  });
  
  // Check for strings that must NOT be present
  notContains.forEach(text => {
    expect(output).not.toContain(text);
  });
  
  // Check regex pattern if provided
  if (matches) {
    expect(output).toMatch(matches);
  }
}

/**
 * Validates the status code and other properties of a command result
 * @param {Object} result - The command execution result
 * @param {Object} expected - Expected result properties
 */
function assertCommandResult(result, expected = {}) {
  if (expected.code !== undefined) {
    expect(result.code).toBe(expected.code);
  }
  
  if (expected.success !== undefined) {
    expect(result.success).toBe(expected.success);
  }
  
  if (expected.output) {
    assertCliOutput(result.stdout, expected.output);
  }
  
  if (expected.error) {
    assertCliOutput(result.stderr, expected.error);
  }
}

module.exports = {
  assertJsonStructure,
  assertCliOutput,
  assertCommandResult
};
