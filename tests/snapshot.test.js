/**
 * Snapshot Tests for CLI Commands
 * 
 * These tests verify that command outputs match
 * expected snapshots to catch unintended changes.
 */

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const { setupMockProject } = require('./helpers/mocks');
const { matchesSnapshot, SNAPSHOTS_DIR } = require('./helpers/snapshots');

// Path to the CLI executable
const CLI_PATH = path.resolve(__dirname, '../bin/paircoder');

// Temp directory for snapshot tests
const TEMP_DIR = path.resolve(__dirname, 'temp/snapshots');

/**
 * Helper function to run CLI commands
 * @param {string} command - The command to run (without the CLI path)
 * @returns {string} Command output
 */
function runCommand(command) {
  try {
    return execSync(`${CLI_PATH} ${command}`, {
      cwd: TEMP_DIR,
      encoding: 'utf8'
    });
  } catch (error) {
    // If the command fails, return the error output for assertion
    return error.stdout ? error.stdout : error.message;
  }
}

describe('CLI Command Snapshot Tests', () => {
  beforeAll(async () => {
    await fs.ensureDir(TEMP_DIR);
    await fs.ensureDir(SNAPSHOTS_DIR);
  });

  afterAll(async () => {
    await fs.remove(TEMP_DIR);
  });
  
  beforeEach(async () => {
    // Clean the temp directory before each test
    await fs.emptyDir(TEMP_DIR);
  });

  describe('Help command snapshots', () => {
    it('should match help command snapshot', async () => {
      const output = runCommand('--help');
      
      const matches = await matchesSnapshot('help-command-output', output, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      expect(matches).toBe(true);
    });
    
    it('should match config help snapshot', async () => {
      const output = runCommand('config --help');
      
      const matches = await matchesSnapshot('config-help-output', output, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      expect(matches).toBe(true);
    });
  });

  describe('Config command snapshots', () => {
    it('should match config get output snapshot', async () => {
      // Setup a basic project first
      await setupMockProject(TEMP_DIR, 'basic');
      
      const output = runCommand('config get');
      
      const matches = await matchesSnapshot('config-get-all-output', output, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      expect(matches).toBe(true);
    });
    
    it('should match specific config get output snapshot', async () => {
      await setupMockProject(TEMP_DIR, 'basic');
      
      const output = runCommand('config get project.name');
      
      const matches = await matchesSnapshot('config-get-single-output', output, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      expect(matches).toBe(true);
    });
  });

  describe('Scan command snapshots', () => {
    it('should match scan output snapshot', async () => {
      await setupMockProject(TEMP_DIR, 'reactApp');
      
      const output = runCommand('scan');
      
      const matches = await matchesSnapshot('scan-output-react-app', output, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      expect(matches).toBe(true);
    });
    
    it('should match scan json output snapshot', async () => {
      await setupMockProject(TEMP_DIR, 'nodeApi');
      
      const output = runCommand('scan --json');
      
      const matches = await matchesSnapshot('scan-json-output-node-api', output, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      expect(matches).toBe(true);
    });
  });

  // Add more snapshot tests for other commands as needed
});
