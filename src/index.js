import { loadConfig, validateConfig } from './config.js';
import { UsageCache } from './cache.js';
import { fetchUsage } from './fetcher.js';
import { formatUsage, getUsageVariant } from './formatter.js';

export const OpenCodeGoUsagePlugin = async ({ client }) => {
  const config = loadConfig();
  const configErrors = validateConfig(config);
  
  if (configErrors.length > 0) {
    console.error('OpenCode Go Usage Plugin config errors:');
    configErrors.forEach(err => console.error(`  - ${err}`));
    console.error('\nPlease create ~/.config/opencode/opencode-go-usage.json');
    return {};
  }

  const cache = new UsageCache(config.refreshIntervalMinutes);

  async function getUsage(force = false) {
    if (!force) {
      const cached = cache.get();
      if (cached) {
        return { ...cached, force };
      }
    }

    try {
      const usage = await fetchUsage(config.workspaceId, config.authCookie);
      cache.set(usage);
      return { data: usage, fromCache: false, force };
    } catch (err) {
      // Try to return stale cache on error
      const cached = cache.get();
      if (cached) {
        return { ...cached, stale: true, error: err.message, force };
      }
      throw err;
    }
  }

  async function displayUsage(force = false) {
    try {
      const result = await getUsage(force);
      const message = formatUsage(result.data);
      const variant = getUsageVariant(result.data);
      
      let finalMessage = message;
      if (result.fromCache && !force) {
        finalMessage += '\n  (cached)';
      }
      if (result.stale) {
        finalMessage += `\n  ⚠️ Warning: Using stale data (${result.error})`;
      }

      await client.tui.showToast({
        body: {
          message: finalMessage,
          variant,
        },
      });
    } catch (err) {
      await client.tui.showToast({
        body: {
          message: `OpenCode Go Usage Error: ${err.message}`,
          variant: 'error',
        },
      });
    }
  }

  // Custom tool definition for manual usage checks
  const ogcUsageTool = {
    description: 'Check OpenCode Go subscription quota and usage',
    args: {},
    async execute() {
      try {
        const result = await getUsage(true); // Force refresh for tool calls
        const message = formatUsage(result.data);
        return message;
      } catch (err) {
        return `Error fetching OpenCode Go usage: ${err.message}`;
      }
    },
  };

  return {
    // Custom tool for usage checks
    tool: {
      ogc_usage: ogcUsageTool,
    },

    // Show at session start (if enabled)
    'session.created': async () => {
      if (config.showAtSessionStart) {
        await displayUsage();
      }
    },
  };
};