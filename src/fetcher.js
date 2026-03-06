export async function fetchUsage(workspaceId, authCookie) {
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
  return parseUsageFromHtml(html);
}

function parseUsageFromHtml(html) {
  // Extract usage data from the SSR JavaScript
  const usage = {
    rolling: null,
    weekly: null,
    monthly: null,
  };

  // Pattern to match: rollingUsage:$R[57]={status:"ok",resetInSec:17854,usagePercent:0}
  const patterns = {
    rolling: /rollingUsage:\$R\[\d+\]=(\{[^}]+\})/,
    weekly: /weeklyUsage:\$R\[\d+\]=(\{[^}]+\})/,
    monthly: /monthlyUsage:\$R\[\d+\]=(\{[^}]+\})/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = html.match(pattern);
    if (match) {
      try {
        // Parse the JSON-like structure (it uses unquoted keys in some cases)
        const jsonStr = match[1]
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
        usage[key] = JSON.parse(jsonStr);
      } catch (err) {
        console.error(`Failed to parse ${key} usage:`, err.message);
      }
    }
  }

  if (!usage.rolling && !usage.weekly && !usage.monthly) {
    throw new Error('Could not parse usage data from page. The website structure may have changed.');
  }

  return usage;
}