# Publishing PairCoder to npm

Follow these steps to publish PairCoder to npm:

## 1. Prepare for Release

### Code Quality Checks

Run the following checks to ensure the code is ready for release:

```bash
# Navigate to the project directory
cd /Users/vasanthan/Desktop/PairCoder

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Pre-release Testing

Test the package locally with a thorough checklist:

```bash
# Create a global link
npm unlink -g paircoder
npm link

# Test the CLI functionality
pc --version
pc init --help
pc scan --help
pc serve --help

# Test the MCP server
pc serve
# In a new terminal:
curl http://localhost:3000/health
curl http://localhost:3000/modules
```

### Update Documentation

Ensure all documentation is up-to-date:

- README.md - Update with latest features
- CLAUDE_INTEGRATION.md - Verify integration instructions
- CHANGELOG.md - Add latest changes

## 2. Update Version

Update the version in package.json before publishing:

```bash
# Update patch version
npm version patch

# Or for more significant changes
npm version minor
```

## 3. Publish to npm

Publish the package to npm:

```bash
npm login
npm publish
```

## 4. Test Published Package

After publishing, test the published package:

```bash
# Unlink the local version
npm unlink -g paircoder

# Install the published version
npm install -g paircoder

# Test the installed command
pc --version
pc serve
```

## 5. Post-Publishing Steps

### Create GitHub Release

Create a new release on GitHub:

1. Tag the version in git:
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

2. Create a new release on GitHub with release notes from CHANGELOG.md

### Announce the Release

Announce the new version in relevant channels:

- Project website (if applicable)
- Social media accounts
- Developer forums or communities

### Monitor for Issues

Monitor for issues in the first 24-48 hours after release:

- Check npm download stats
- Watch GitHub issues
- Monitor support channels

## Troubleshooting

If you encounter issues during publishing:

- Check npm credentials with `npm whoami`
- Verify package name is not already taken with `npm view paircoder`
- Check for errors in .npmrc if they exist
- If publish fails with 403, check npm account permissions
- For version conflicts, use `npm version` instead of manually editing package.json

## Rollback Procedure

If critical issues are discovered after publishing:

```bash
# Deprecate the problematic version
npm deprecate paircoder@0.1.1 "Critical issue found, please use version 0.1.0 instead"

# Publish a fixed version as quickly as possible
# Fix the issues
npm version patch
npm publish
```
