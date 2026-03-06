# OpenCode Go Usage Plugin

Display your OpenCode Go subscription quota and usage directly in OpenCode.

## Features

- 📊 **View Usage**: Check rolling, weekly, and monthly usage percentages
- ⏰ **Reset Times**: See when your quota resets
- 🔔 **Session Notifications**: Optionally show usage when starting a session
- 💾 **Smart Caching**: Cached for 5 minutes to avoid excessive requests
- 🚀 **Command Support**: Use `/ogc-usage` or ask naturally anytime

## Installation

### Via npm (Recommended)

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-go-usage"
  ]
}
```

OpenCode will automatically install the plugin on next startup using Bun.

### Manual Installation

Copy `index.js` to `~/.config/opencode/plugins/opencode-go-usage.js`

## Configuration

Create `~/.config/opencode/opencode-go-usage.json`:

```json
{
  "workspaceId": "wrk_YOUR_WORKSPACE_ID",
  "authCookie": "Fe26.2**YOUR_AUTH_COOKIE",
  "refreshIntervalMinutes": 5,
  "showAtSessionStart": true
}
```

### Getting Your Credentials

1. **Workspace ID**: From your billing URL: `https://opencode.ai/workspace/{WORKSPACE_ID}/billing`

2. **Auth Cookie**: 
   - Open browser dev tools (F12)
   - Go to Application/Storage → Cookies
   - Find the `auth` cookie
   - Copy the value (starts with `Fe26.2**`)

### Environment Variables

You can also use environment variables:

```bash
export OPENCODE_GO_WORKSPACE_ID="wrk_..."
export OPENCODE_GO_AUTH_COOKIE="Fe26.2**..."
```

## Usage

### Method 1: Command (Recommended)

Type in the OpenCode prompt:

```
/ogc-usage
```

### Method 2: Natural Language

Ask the AI:

```
What's my OpenCode Go usage?
Show me my OpenCode Go quota
Check my OpenCode Go subscription usage
```

The plugin exposes a custom tool that the AI can use to fetch and display your usage.

### Auto-Display

If `showAtSessionStart` is enabled, usage automatically displays when you start a new session.

### Output Example

```
OpenCode Go Usage:
  Rolling:  0%  (resets in 4h 57m)
  Weekly:   17% (resets in 2d 18h)
  Monthly:  8%  (resets in 29d 22h)
```

Colors indicate status:
- 🟢 Green: < 50% usage
- 🟡 Yellow: 50-80% usage
- 🔴 Red: > 80% usage

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `workspaceId` | (required) | Your OpenCode workspace ID |
| `authCookie` | (required) | Your auth cookie from browser |
| `refreshIntervalMinutes` | 5 | How often to fetch fresh data |
| `showAtSessionStart` | true | Show usage when session starts |

## Troubleshooting

### "Authentication failed"
- Your auth cookie may have expired
- Get a fresh cookie from your browser

### "Could not parse usage data"
- The website structure may have changed
- Open an issue on GitHub

### Usage not showing at session start
- Check that `showAtSessionStart` is `true`
- Verify config file is at the correct path

## License

MIT