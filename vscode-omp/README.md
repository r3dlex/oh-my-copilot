# vscode-omp

This directory is reserved for OMP's optional VS Code companion extension.

The root package in this repository remains the primary GitHub Copilot CLI plugin. The `vscode-omp/` package is the
editor-side companion that will own VSIX packaging, UI surfaces such as activity trees/status bar entries, and any
package-local tests required for that experience.

## Expected package responsibilities

- Build the VS Code extension independently from the root plugin package
- Keep package-local tests under `vscode-omp/test/`
- Produce a `.vsix` artifact via the package's own `package` script
- Document editor-specific install/debug flows without duplicating root plugin docs

## Expected verification flow

When `vscode-omp/package.json` exists, run the following from this directory:

```bash
npm ci
npm run build --if-present
npm test --if-present
npm run package --if-present
```

CI/release workflows in the repository root already treat this package as optional and will only run these steps when
the package scaffold exists.
