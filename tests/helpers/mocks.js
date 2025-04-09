/**
 * Test Mocks and Fixtures
 * 
 * This file contains mock data and project configurations for PairCoder tests.
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Collection of mock project configurations and files
 */
const mockProjects = {
  basic: {
    files: {
      'package.json': JSON.stringify({
        name: 'basic-project',
        version: '1.0.0',
        description: 'A basic test project'
      }, null, 2),
      'paircoder.config.json': JSON.stringify({
        project: {
          name: 'basic-project',
          excludes: ['node_modules', 'dist', '.git']
        },
        context: {
          defaultLevel: 'medium',
          tokenBudget: 4000
        }
      }, null, 2),
      'src/index.js': `/**
 * Main entry point for the application
 */
console.log('Hello PairCoder!');
`
    },
    dirs: ['src', 'tests']
  },
  
  reactApp: {
    files: {
      'package.json': JSON.stringify({
        name: 'react-test-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test'
        }
      }, null, 2),
      'paircoder.config.json': JSON.stringify({
        project: {
          name: 'react-test-app',
          type: 'react',
          templates: 'react-templates',
          excludes: ['node_modules', 'build', '.git']
        },
        context: {
          defaultLevel: 'high',
          tokenBudget: 8000
        }
      }, null, 2),
      'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      'src/App.js': `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello, PairCoder!</h1>
    </div>
  );
}

export default App;`
    },
    dirs: ['src', 'public', 'src/components']
  },
  
  nodeApi: {
    files: {
      'package.json': JSON.stringify({
        name: 'node-api',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.2',
          mongoose: '^7.0.0'
        },
        scripts: {
          start: 'node src/index.js',
          dev: 'nodemon src/index.js'
        }
      }, null, 2),
      'paircoder.config.json': JSON.stringify({
        project: {
          name: 'node-api',
          type: 'node-api',
          templates: 'api-templates',
          excludes: ['node_modules', 'logs', '.git']
        },
        context: {
          defaultLevel: 'medium',
          tokenBudget: 6000
        }
      }, null, 2),
      'src/index.js': `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.listen(port, () => console.log(\`Server running on port \${port}\`));`
    },
    dirs: ['src', 'src/routes', 'src/models', 'src/controllers']
  }
};

/**
 * Creates a mock project environment in the specified directory
 * @param {string} targetDir - Directory to create mock project in
 * @param {string} projectType - Type of mock project to create ('basic', 'reactApp', or 'nodeApi')
 * @returns {string} The path to the created project
 */
async function setupMockProject(targetDir, projectType = 'basic') {
  if (!mockProjects[projectType]) {
    throw new Error(`Unknown project type: ${projectType}`);
  }

  const project = mockProjects[projectType];

  // Clean directory if it exists
  await fs.ensureDir(targetDir);
  
  // Create directories
  for (const dir of project.dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }

  // Create files
  for (const [filePath, content] of Object.entries(project.files)) {
    const fullPath = path.join(targetDir, filePath);
    const fileDir = path.dirname(fullPath);
    
    await fs.ensureDir(fileDir);
    await fs.writeFile(fullPath, content);
  }

  return targetDir;
}

/**
 * Mock CLI command result
 * @typedef {Object} MockCommandResult
 * @property {number} code - Exit code (0 = success)
 * @property {string} stdout - Standard output
 * @property {string} stderr - Standard error output
 * @property {boolean} success - Whether the command was successful
 */

/**
 * Creates a mock CLI command result
 * @param {Object} options - Options for the mock result
 * @param {number} options.code - Exit code (default: 0)
 * @param {string} options.stdout - Standard output (default: '')
 * @param {string} options.stderr - Standard error output (default: '')
 * @returns {MockCommandResult} The mock command result
 */
function createMockCommandResult(options = {}) {
  const { code = 0, stdout = '', stderr = '' } = options;
  
  return {
    code,
    stdout,
    stderr,
    success: code === 0
  };
}

module.exports = {
  setupMockProject,
  mockProjects,
  createMockCommandResult
};
