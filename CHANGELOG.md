# PairCoder Changelog

## v0.3.0 (2025-04-12)

### Added
- **New Auto-Detect Feature**: Added `paircoder-auto` command that automatically detects the current project directory
- Enhanced MCP integration with Claude Desktop with zero-configuration support
- Project root detection algorithm that identifies common project structures
- Improved documentation with detailed Claude Desktop integration guide

### Changed
- Updated the MCP server to better support the Model Context Protocol standard
- Enhanced `serve` command with project directory and auto-initialization support
- Improved initialization process with non-interactive mode for automation

### Fixed
- Fixed MCP server JSON-RPC protocol compliance
- Better error handling for edge cases in project detection
- Improved stability when working with multiple projects

## v0.2.3 (2025-04-11)
- Fixed context generation in the MCP server when no files are found
- Added robust error handling for the `/context` endpoint
- Improved module scanning with a new `scanDirectory` method in the project scanner

### Added
- Enhanced documentation for Claude integration
- Added troubleshooting tips for common MCP server issues
- Better error messages when module files cannot be found

### Changed
- Updated the MCP server to use `exportContext` for more reliable context generation
- Improved error reporting in the MCP server endpoints

## v0.1.0 (Initial Release)

- Initial implementation of PairCoder
- Basic project scanning and module detection
- Command-line interface with init, scan, and serve commands
- Model Context Protocol (MCP) server for Claude integration
