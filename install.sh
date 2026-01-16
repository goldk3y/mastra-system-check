#!/bin/bash

# Mastra System Check - Claude Code Skill Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/mastra-system-check/main/install.sh | bash

set -e

SKILL_NAME="mastra-system-check"
SKILL_DIR="$HOME/.claude/skills/$SKILL_NAME"
REPO_URL="https://github.com/goldk3y/mastra-system-check"

echo "Installing $SKILL_NAME skill for Claude Code..."

# Create skills directory if it doesn't exist
mkdir -p "$HOME/.claude/skills"

# Remove existing installation if present
if [ -d "$SKILL_DIR" ]; then
  echo "Removing existing installation..."
  rm -rf "$SKILL_DIR"
fi

# Clone the repository
echo "Downloading skill..."
git clone --depth 1 "$REPO_URL" "$SKILL_DIR" 2>/dev/null

# Remove git directory to save space
rm -rf "$SKILL_DIR/.git"

echo ""
echo "✓ $SKILL_NAME installed successfully!"
echo ""
echo "Location: $SKILL_DIR"
echo ""
echo "The skill will automatically activate when working with Mastra projects."
echo "To manually trigger, ask Claude Code to 'run a Mastra system check'."
