#!/usr/bin/env bash
# omp-adopt.sh — Adopt OMP into a target project
#
# Usage:
#   ./scripts/omp-adopt.sh [--target <path>] [--mode template|submodule|subtree]
#
# Modes:
#   template   (default) Copy .copilot/ docs plus required hook/plugin files
#   submodule  Add as git submodule at .omp/ and symlink .copilot/ docs
#   subtree    Add as git subtree

set -euo pipefail

OMP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="."
MODE="template"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET_DIR="$2"; shift 2 ;;
    --mode)   MODE="$2";       shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--target <path>] [--mode template|submodule|subtree]"
      exit 0 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

echo "OMP Adopt"
echo "  Source: $OMP_DIR"
echo "  Target: $TARGET_DIR"
echo "  Mode:   $MODE"
echo ""

case "$MODE" in
  template)
    echo "Copying Copilot docs into .copilot/ plus required hook/plugin entrypoints..."
    mkdir -p "$TARGET_DIR/.github"
    mkdir -p "$TARGET_DIR/.copilot"
    cp -r "$OMP_DIR/.github/hooks"     "$TARGET_DIR/.github/hooks"
    cp -r "$OMP_DIR/.copilot/."        "$TARGET_DIR/.copilot/"
    echo "Done. Copilot docs copied to $TARGET_DIR/.copilot/ and required hook/plugin entrypoints kept in $TARGET_DIR/.github/."
    echo ""
    echo "Optional: install MCP companion"
    echo "  npm install oh-my-githubcopilot"
    echo "  omp setup"
    ;;

  submodule)
    echo "Adding OMP as git submodule at .omp/ ..."
    cd "$TARGET_DIR"
    git submodule add https://github.com/r3dlex/oh-my-githubcopilot.git .omp
    mkdir -p .github
    mkdir -p .copilot
    ln -sfn ../.omp/.github/hooks     .github/hooks
    ln -sfn ../.omp/.copilot/README.md .copilot/README.md
    ln -sfn ../.omp/.copilot/copilot-instructions.md .copilot/copilot-instructions.md
    ln -sfn ../.omp/.copilot/copilot-reference.md .copilot/copilot-reference.md
    ln -sfn ../.omp/.copilot/agents .copilot/agents
    ln -sfn ../.omp/.copilot/skills .copilot/skills
    echo "Done. OMP added as submodule with Copilot docs under .copilot/ and required hooks under .github/."
    ;;

  subtree)
    echo "Adding OMP as git subtree at .omp/ ..."
    cd "$TARGET_DIR"
    git subtree add --prefix=.omp https://github.com/r3dlex/oh-my-githubcopilot.git main --squash
    mkdir -p .github
    mkdir -p .copilot
    cp -r .omp/.github/hooks     .github/hooks
    cp -r .omp/.copilot/. .copilot/
    echo "Done. OMP added as subtree with Copilot docs under .copilot/ and required hooks under .github/."
    ;;

  *)
    echo "Unknown mode: $MODE. Use template, submodule, or subtree."
    exit 1 ;;
esac
