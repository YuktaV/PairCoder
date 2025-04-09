/**
 * PairCoder Git Integration
 * 
 * This module handles integration with Git for version management.
 * It provides functions for working with Git repositories and commits.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { storageManager } = require('../storage/manager');

// Promisified exec
const execPromise = promisify(exec);

/**
 * Git Integration for PairCoder
 */
class GitIntegration {
  /**
   * Get Git information for the current repository
   * 
   * @returns {Promise<Object>} Git information
   */
  async getGitInfo() {
    try {
      // Check if Git is installed and if this is a Git repository
      await execPromise('git rev-parse --is-inside-work-tree');
      
      // Get current commit
      const { stdout: commitHash } = await execPromise('git rev-parse HEAD');
      
      // Get current branch
      const { stdout: branchName } = await execPromise('git rev-parse --abbrev-ref HEAD');
      
      // Get commit message
      const { stdout: commitMessage } = await execPromise('git log -1 --pretty=%B');
      
      // Check for uncommitted changes
      const { stdout: status } = await execPromise('git status --porcelain');
      const hasUncommittedChanges = status.trim().length > 0;
      
      return {
        commit: commitHash.trim(),
        branch: branchName.trim(),
        message: commitMessage.trim(),
        hasUncommittedChanges,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error getting Git information: ${error.message}`);
    }
  }

  /**
   * Create a version from a Git commit
   * 
   * @param {string} commitHash Git commit hash
   * @param {string} versionName Optional version name (uses commit hash if not provided)
   * @returns {Promise<Object>} Created version
   */
  async createVersionFromCommit(commitHash, versionName = null) {
    try {
      // Validate commit hash
      if (!commitHash || commitHash.trim() === '') {
        throw new Error('Commit hash cannot be empty');
      }
      
      // Get commit information
      const { stdout: commitInfo } = await execPromise(`git show -s --format=%B ${commitHash}`);
      const { stdout: commitDate } = await execPromise(`git show -s --format=%ci ${commitHash}`);
      
      // Use commit hash as version name if not provided
      const name = versionName || commitHash.substring(0, 8);
      
      // Get files changed in commit
      const { stdout: changedFiles } = await execPromise(`git diff-tree --no-commit-id --name-only -r ${commitHash}`);
      const files = changedFiles.split('\n').filter(Boolean);
      
      // Build version snapshot
      const snapshot = {
        name,
        timestamp: new Date(commitDate.trim()).toISOString(),
        notes: `Created from Git commit ${commitHash}: ${commitInfo.trim()}`,
        modules: {},
        git: {
          commit: commitHash.trim(),
          message: commitInfo.trim(),
          date: commitDate.trim(),
          changedFiles: files
        }
      };
      
      // Save the snapshot
      await storageManager.saveVersion(name, snapshot);
      
      // Add journal entry
      await storageManager.addJournalEntry(`Created version '${name}' from Git commit ${commitHash}`);
      
      return {
        name,
        timestamp: snapshot.timestamp,
        moduleCount: Object.keys(snapshot.modules).length,
        hasGitInfo: true
      };
    } catch (error) {
      throw new Error(`Error creating version from commit: ${error.message}`);
    }
  }

  /**
   * Link a version to a Git commit
   * 
   * @param {string} versionName Version name
   * @param {string} commitHash Git commit hash
   * @returns {Promise<Object>} Updated version
   */
  async linkVersionToCommit(versionName, commitHash) {
    try {
      // Validate inputs
      if (!versionName || versionName.trim() === '') {
        throw new Error('Version name cannot be empty');
      }
      
      if (!commitHash || commitHash.trim() === '') {
        throw new Error('Commit hash cannot be empty');
      }
      
      // Get version
      const version = await storageManager.getVersion(versionName);
      if (!version) {
        throw new Error(`Version '${versionName}' not found`);
      }
      
      // Get commit information
      const { stdout: commitInfo } = await execPromise(`git show -s --format=%B ${commitHash}`);
      const { stdout: commitDate } = await execPromise(`git show -s --format=%ci ${commitHash}`);
      
      // Get files changed in commit
      const { stdout: changedFiles } = await execPromise(`git diff-tree --no-commit-id --name-only -r ${commitHash}`);
      const files = changedFiles.split('\n').filter(Boolean);
      
      // Update Git information
      version.git = {
        commit: commitHash.trim(),
        message: commitInfo.trim(),
        date: commitDate.trim(),
        changedFiles: files
      };
      
      // Save updated version
      await storageManager.saveVersion(versionName, version);
      
      // Add journal entry
      await storageManager.addJournalEntry(`Linked version '${versionName}' to Git commit ${commitHash}`);
      
      return {
        name: versionName,
        timestamp: version.timestamp,
        moduleCount: Object.keys(version.modules).length,
        hasGitInfo: true
      };
    } catch (error) {
      throw new Error(`Error linking version to commit: ${error.message}`);
    }
  }

  /**
   * Get Git diff between two commits
   * 
   * @param {string} fromCommit Source commit hash
   * @param {string} toCommit Target commit hash
   * @returns {Promise<string>} Git diff
   */
  async getCommitDiff(fromCommit, toCommit) {
    try {
      const { stdout: diff } = await execPromise(`git diff ${fromCommit} ${toCommit}`);
      return diff;
    } catch (error) {
      throw new Error(`Error getting commit diff: ${error.message}`);
    }
  }

  /**
   * Get Git diff for a specific file between two commits
   * 
   * @param {string} filePath File path
   * @param {string} fromCommit Source commit hash
   * @param {string} toCommit Target commit hash
   * @returns {Promise<string>} Git diff
   */
  async getFileDiff(filePath, fromCommit, toCommit) {
    try {
      const { stdout: diff } = await execPromise(`git diff ${fromCommit} ${toCommit} -- ${filePath}`);
      return diff;
    } catch (error) {
      throw new Error(`Error getting file diff: ${error.message}`);
    }
  }

  /**
   * Check if Git is available and properly configured
   * 
   * @returns {Promise<boolean>} Git availability status
   */
  async isGitAvailable() {
    try {
      await execPromise('git --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if current directory is a Git repository
   * 
   * @returns {Promise<boolean>} Git repository status
   */
  async isGitRepository() {
    try {
      await execPromise('git rev-parse --is-inside-work-tree');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const gitIntegration = new GitIntegration();
module.exports = { gitIntegration };
