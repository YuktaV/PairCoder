/**
 * Snapshot Testing Helpers
 * 
 * This file contains utility functions for snapshot testing of CLI command outputs.
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// Directory for storing snapshots
const SNAPSHOTS_DIR = path.resolve(__dirname, '../snapshots');

/**
 * Creates a hash for the snapshot name to ensure filename compatibility
 * @param {string} name - The snapshot name 
 * @returns {string} A hashed version of the name
 */
function hashSnapshotName(name) {
  return crypto
    .createHash('md5')
    .update(name)
    .digest('hex')
    .substring(0, 10);
}

/**
 * Creates a snapshot of command output
 * @param {string} name - Unique name for the snapshot
 * @param {string} output - Command output to save
 */
async function createSnapshot(name, output) {
  await fs.ensureDir(SNAPSHOTS_DIR);
  
  const hash = hashSnapshotName(name);
  const filename = `${hash}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.snap`;
  const snapPath = path.join(SNAPSHOTS_DIR, filename);
  
  await fs.writeFile(snapPath, output);
  
  return snapPath;
}

/**
 * Checks if command output matches a previously created snapshot
 * @param {string} name - Name of the snapshot to check against
 * @param {string} output - Command output to compare 
 * @param {Object} options - Additional options
 * @param {boolean} options.updateSnapshots - Whether to update snapshots if they don't match
 * @returns {boolean} Whether the output matches the snapshot
 */
async function matchesSnapshot(name, output, options = {}) {
  const { updateSnapshots = false } = options;
  
  await fs.ensureDir(SNAPSHOTS_DIR);
  
  const hash = hashSnapshotName(name);
  const filename = `${hash}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.snap`;
  const snapPath = path.join(SNAPSHOTS_DIR, filename);
  
  // If snapshot doesn't exist, create it
  if (!await fs.pathExists(snapPath)) {
    await fs.writeFile(snapPath, output);
    return true;
  }
  
  // Read existing snapshot and compare
  const existingSnapshot = await fs.readFile(snapPath, 'utf8');
  const matches = existingSnapshot === output;
  
  // Update snapshot if requested
  if (!matches && updateSnapshots) {
    await fs.writeFile(snapPath, output);
    return true;
  }
  
  return matches;
}

/**
 * Jest matcher for snapshot testing
 * @param {string} received - The command output to compare
 * @param {string} snapshotName - Name of the snapshot
 */
function toMatchCommandSnapshot(received, snapshotName) {
  const updateSnapshots = process.env.UPDATE_SNAPSHOTS === 'true';
  
  return matchesSnapshot(snapshotName, received, { updateSnapshots })
    .then(matches => ({
      message: () =>
        `Expected command output to match snapshot "${snapshotName}"`,
      pass: matches
    }));
}

// Add a custom Jest matcher
if (global.expect) {
  expect.extend({
    toMatchCommandSnapshot(received, snapshotName) {
      if (typeof received !== 'string') {
        return {
          message: () => 'Command output must be a string',
          pass: false
        };
      }
      
      return toMatchCommandSnapshot(received, snapshotName);
    }
  });
}

module.exports = {
  createSnapshot,
  matchesSnapshot,
  SNAPSHOTS_DIR
};
