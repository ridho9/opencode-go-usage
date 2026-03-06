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

function loadConfig() {
  const configPaths = getConfigPaths();
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        const fileConfig = JSON.parse(content);
        return {
          workspaceId: process.env.OPENCODE_GO_WORKSPACE_ID || fileConfig.workspaceId,
          authCookie: process.env.OPENCODE_GO_AUTH_COOKIE || fileConfig.authCookie,
          refreshIntervalMinutes: fileConfig.refreshIntervalMinutes ?? 5,
          showAtSessionStart: fileConfig.showAtSessionStart ?? true,
        };
      } catch (err) {
        console.error(`Error loading config from ${configPath}:`, err.message);
      }
    }
  }
  
  return {
    workspaceId: process.env.OPENCODE_GO_WORKSPACE_ID,
    authCookie: process.env.OPENCODE_GO_AUTH_COOKIE,
    refreshIntervalMinutes: 5,
    showAtSessionStart: true,
  };
}

function validateConfig(config) {
  const errors = [];
  if (!config.workspaceId) {
    errors.push('Missing workspaceId. Set OPENCODE_GO_WORKSPACE_ID or add to config file.');
  }
  if (!config.authCookie) {
    errors.push('Missing authCookie. Set OPENCODE_GO_AUTH_COOKIE or add to config file.');
  }
  return errors;
}

class UsageCache {
  constructor(ttlMinutes = 5) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.data = null;
    this.timestamp = null;
  }

  isValid() {
    if (!this.data || !this.timestamp) return false;
    return (Date.now() - this.timestamp) < this.ttlMs;
  }

  get() {
    return this.isValid() ? { data: this.data, fromCache: true } : null;
  }

  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  }
}

async function fetchUsage(workspaceId, authCookie) {
  const url = `https://opencode.ai/workspace/${workspaceId}/billing`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': `auth=${authCookie}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please check your auth cookie.');
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  
  const usage = { rolling: null, weekly: null, monthly: null };
  const patterns = {
    rolling: /rollingUsage:\$R\[\d+\]=(\{[^}]+\})/,
    weekly: /weeklyUsage:\$R\[\d+\]=(\{[^}]+\})/,
    monthly: /monthlyUsage:\$R\[\d+\]=(\{[^}]+\})/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = html.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1].replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
        usage[key] = JSON.parse(jsonStr);
      } catch (err) {
        console.error(`Failed to parse ${key} usage:`, err.message);
      }
    }
  }

  if (!usage.rolling && !usage.weekly && !usage.monthly) {
    throw new Error('Could not parse usage data from page.');
  }

  return usage;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

function formatUsage(usage) {
  const lines = ['OpenCode Go Usage:'];
  
  if (usage.rolling) {
    lines.push(`  Rolling:  ${usage.rolling.usagePercent}% (resets in ${formatDuration(usage.rolling.resetInSec)})`);
  }
  if (usage.weekly) {
    lines.push(`  Weekly:   ${usage.weekly.usagePercent}% (resets in ${formatDuration(usage.weekly.resetInSec)})`);
  }
  if (usage.monthly) {
    lines.push(`  Monthly:  ${usage.monthly.usagePercent}% (resets in ${formatDuration(usage.monthly.resetInSec)})`);
  }
  
  return lines.join('\n');
}

export const OpenCodeGoUsagePlugin = async ({ client }) => {
  console.log('[OpenCode Go Usage] Plugin loading...');
  const config = loadConfig();
  console.log('[OpenCode Go Usage] Config loaded:', { showAtSessionStart: config.showAtSessionStart });
  const configErrors = validateConfig(config);
  
  if (configErrors.length > 0) {
    console.error('OpenCode Go Usage Plugin config errors:');
    configErrors.forEach(err => console.error(`  - ${err}`));
    return {};
  }

  const cache = new UsageCache(config.refreshIntervalMinutes);

  async function getUsage(force = false) {
    if (!force) {
      const cached = cache.get();
      if (cached) return cached;
    }

    try {
      const usage = await fetchUsage(config.workspaceId, config.authCookie);
      cache.set(usage);
      return { data: usage, fromCache: false };
    } catch (err) {
      const cached = cache.get();
      if (cached) return { ...cached, stale: true, error: err.message };
      throw err;
    }
  }

  return {
    tool: {
      ogc_usage: {
        description: 'Check OpenCode Go subscription quota and usage',
        args: {},
        async execute() {
          try {
            const result = await getUsage(true);
            return formatUsage(result.data);
          } catch (err) {
            return `Error: ${err.message}`;
          }
        },
      },
    },

    'session.created': async () => {
      console.log('[OpenCode Go Usage] session.created fired, showAtSessionStart:', config.showAtSessionStart);
      if (config.showAtSessionStart) {
        try {
          console.log('[OpenCode Go Usage] Fetching usage...');
          const result = await getUsage();
          console.log('[OpenCode Go Usage] Got usage:', result.data);
          await client.tui.showToast({
            body: { message: formatUsage(result.data), variant: 'info' },
          });
          console.log('[OpenCode Go Usage] Toast shown');
        } catch (err) {
          console.error('[OpenCode Go Usage] Failed to show usage:', err.message);
        }
      }
    },

    // Debug: log all events
    'event': async ({ event }) => {
      console.log('[OpenCode Go Usage] Event:', event.type);
    },
  };
};