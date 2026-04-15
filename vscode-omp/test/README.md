# vscode-omp test lane

Package-local extension tests should live here once the VS Code companion scaffold lands.

Suggested coverage priorities:

1. Command wiring and argument translation
2. Activity-tree/state helper behavior
3. Status-bar rendering/state transitions
4. Trust-gated MCP/provider handoff behavior
5. VSIX smoke/package validation

Until the extension scaffold exists, root CI only prepares conditional hooks for this directory and does not require
these tests to be present.
