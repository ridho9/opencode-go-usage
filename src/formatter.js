function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}

function getVariant(percent) {
  if (percent >= 80) return 'error';
  if (percent >= 50) return 'warning';
  return 'success';
}

export function formatUsage(usage) {
  const lines = ['OpenCode Go Usage:'];
  
  if (usage.rolling) {
    const resetTime = formatDuration(usage.rolling.resetInSec);
    lines.push(`  Rolling:  ${usage.rolling.usagePercent}% (resets in ${resetTime})`);
  }
  
  if (usage.weekly) {
    const resetTime = formatDuration(usage.weekly.resetInSec);
    lines.push(`  Weekly:   ${usage.weekly.usagePercent}% (resets in ${resetTime})`);
  }
  
  if (usage.monthly) {
    const resetTime = formatDuration(usage.monthly.resetInSec);
    lines.push(`  Monthly:  ${usage.monthly.usagePercent}% (resets in ${resetTime})`);
  }
  
  return lines.join('\n');
}

export function getUsageVariant(usage) {
  const percents = [
    usage.rolling?.usagePercent,
    usage.weekly?.usagePercent,
    usage.monthly?.usagePercent,
  ].filter(Boolean);
  
  const maxPercent = Math.max(...percents);
  return getVariant(maxPercent);
}