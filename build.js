import fs from 'fs';
import path from 'path';

const srcDir = 'src';
const distDir = 'dist';

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read all source files
const files = ['config.js', 'cache.js', 'fetcher.js', 'formatter.js', 'index.js'];
let bundledCode = '';

// Add imports and banner
bundledCode += `/**
 * OpenCode Go Usage Plugin
 * @version 1.0.0
 * @license MIT
 */\n\n`;
bundledCode += `import fs from 'fs';\n`;
bundledCode += `import path from 'path';\n`;
bundledCode += `import os from 'os';\n\n`;

for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // Remove import statements (we'll inline everything)
  const withoutImports = content
    .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
    .replace(/export\s+/g, '');
  
  bundledCode += `// === ${file} ===\n`;
  bundledCode += withoutImports;
  bundledCode += '\n\n';
}

// Add the final export
bundledCode += `// === Export ===\n`;
bundledCode += `export { OpenCodeGoUsagePlugin };\n`;

// Write bundled file
fs.writeFileSync(path.join(distDir, 'index.js'), bundledCode);

console.log('✓ Build complete: dist/index.js');

// Copy README and create example config
fs.copyFileSync('README.md', path.join(distDir, 'README.md'));

const exampleConfig = {
  workspaceId: "wrk_YOUR_WORKSPACE_ID",
  authCookie: "Fe26.2**YOUR_AUTH_COOKIE_HERE",
  refreshIntervalMinutes: 5,
  showAtSessionStart: true
};

fs.writeFileSync(
  path.join(distDir, 'opencode-go-usage.json.example'),
  JSON.stringify(exampleConfig, null, 2)
);

console.log('✓ Copied README.md');
console.log('✓ Created opencode-go-usage.json.example');