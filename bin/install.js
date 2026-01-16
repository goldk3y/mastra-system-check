#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_NAME = 'mastra-system-check';
const SKILL_DIR = path.join(process.env.HOME, '.claude', 'skills', SKILL_NAME);

console.log(`\nInstalling ${SKILL_NAME} skill for Claude Code...\n`);

// Create skills directory
const skillsDir = path.join(process.env.HOME, '.claude', 'skills');
if (!fs.existsSync(skillsDir)) {
  fs.mkdirSync(skillsDir, { recursive: true });
}

// Remove existing installation
if (fs.existsSync(SKILL_DIR)) {
  console.log('Removing existing installation...');
  fs.rmSync(SKILL_DIR, { recursive: true });
}

// Copy files from package
const packageDir = path.join(__dirname, '..');
const filesToCopy = ['SKILL.md', 'AGENTS.md', 'metadata.json', 'README.md'];
const dirsToCopy = ['rules'];

fs.mkdirSync(SKILL_DIR, { recursive: true });

// Copy files
filesToCopy.forEach(file => {
  const src = path.join(packageDir, file);
  const dest = path.join(SKILL_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const src = path.join(packageDir, dir);
  const dest = path.join(SKILL_DIR, dir);
  if (fs.existsSync(src)) {
    copyDirSync(src, dest);
  }
});

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`✓ ${SKILL_NAME} installed successfully!\n`);
console.log(`Location: ${SKILL_DIR}\n`);
console.log('The skill will automatically activate when working with Mastra projects.');
console.log('To manually trigger, ask Claude Code to "run a Mastra system check".\n');
