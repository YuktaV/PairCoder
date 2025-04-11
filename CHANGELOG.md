# PairCoder Changelog

## v0.1.1 (2025-04-11)

### Fixed
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
