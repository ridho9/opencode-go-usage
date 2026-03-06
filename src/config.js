import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILE = 'opencode-go-usage.json';

function getConfigPaths() {
  const homeDir = os.homedir();
  return [
    path.join(homeDir, '.config', 'opencode', CONFIG_FILE),
    path.join(homeDir, '.opencode', CONFIG_FILE),
    path.join(process.cwd(), '.opencode', CONFIG_FILE),
  ];
}

export function loadConfig() {
  const configPaths = getConfigPaths();
  
  // Try to load from file
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        const fileConfig = JSON.parse(content);
        return mergeWithEnv(fileConfig);
      } catch (err) {
        console.error(`Error loading config from ${configPath}:`, err.message);
      }
    }
  }
  
  // Fallback to env-only config
  return mergeWithEnv({});
}

function mergeWithEnv(fileConfig) {
  return {
    workspaceId: process.env.OPENCODE_GO_WORKSPACE_ID || fileConfig.workspaceId,
    authCookie: process.env.OPENCODE_GO_AUTH_COOKIE || fileConfig.authCookie,
    refreshIntervalMinutes: fileConfig.refreshIntervalMinutes ?? 5,
    showAtSessionStart: fileConfig.showAtSessionStart ?? true,
    ...fileConfig,
  };
}

export function validateConfig(config) {
  const errors = [];
  
  if (!config.workspaceId) {
    errors.push('Missing workspaceId. Set OPENCODE_GO_WORKSPACE_ID or add to config file.');
  }
  
  if (!config.authCookie) {
    errors.push('Missing authCookie. Set OPENCODE_GO_AUTH_COOKIE or add to config file.');
  }
  
  return errors;
}