/**
 * Script to update test snapshots
 */

const { execSync } = require('child_process');

// Run jest with update-snapshots flag
console.log('Updating test snapshots...');
try {
  execSync('UPDATE_SNAPSHOTS=true npm test', {
    stdio: 'inherit' // Forward stdout/stderr to console
  });
  console.log('Snapshots updated successfully!');
} catch (error) {
  console.error('Error updating snapshots:', error.message);
  process.exit(1);
}
