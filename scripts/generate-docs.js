const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Ensure docs directory exists
fs.ensureDirSync('docs');

// Copy documentation files
const docs = [
  'DOCUMENTATION.md',
  'CURSOR_INTEGRATION.md',
  'README.md'
];

docs.forEach(doc => {
  const source = path.join(__dirname, '..', doc);
  const target = path.join(__dirname, '..', 'docs', doc);
  
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
    console.log(`Copied ${doc} to docs directory`);
  }
});

// Generate API documentation
try {
  execSync('npx jsdoc -c jsdoc.json', { stdio: 'inherit' });
  console.log('Generated API documentation');
} catch (error) {
  console.error('Error generating API documentation:', error.message);
}

console.log('Documentation generation complete!'); 