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

### Option 1: Environment Variables (Recommended)

**Most secure option** - credentials not stored on disk:

```bash
export OPENCODE_GO_WORKSPACE_ID="wrk_YOUR_WORKSPACE_ID"
export OPENCODE_GO_AUTH_COOKIE="Fe26.2**YOUR_AUTH_COOKIE"
export OPENCODE_GO_REFRESH_MINUTES=5
export OPENCODE_GO_SHOW_AT_START=true
```

Add to your `~/.bashrc`, `~/.zshrc`, or use a tool like [direnv](https://direnv.net/).

### Option 2: Config File

Create `~/.config/opencode/opencode-go-usage.json`:

```json
{
  "workspaceId": "wrk_YOUR_WORKSPACE_ID",
  "authCookie": "Fe26.2**YOUR_AUTH_COOKIE",
  "refreshIntervalMinutes": 5,
  "showAtSessionStart": true
}
```

**Security:** Set restrictive permissions:
```bash
chmod 600 ~/.config/opencode/opencode-go-usage.json
```

⚠️ **Warning:** Config files can be accidentally committed to git. Use environment variables for better security.

### Getting Your Credentials

1. **Workspace ID**: From your billing URL: `https://opencode.ai/workspace/{WORKSPACE_ID}/billing`

2. **Auth Cookie**: 
   - Open browser dev tools (F12)
   - Go to Application/Storage → Cookies
   - Find the `auth` cookie
   - Copy the value (starts with `Fe26.2**`)

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

## Security

### Credential Storage

This plugin requires your OpenCode auth cookie to fetch usage data. Two storage options:

1. **Environment Variables (Recommended)**
   - Credentials exist only in memory
   - Not written to disk
   - Won't be accidentally committed to git

2. **Config File**
   - Convenient but stored as plaintext
   - Risk of accidental git commits
   - Set file permissions to `600` (owner read/write only)

### Best Practices

- **Use environment variables** for production/studio environments
- **Rotate your auth cookie** periodically (get a fresh one from browser)
- **Never commit** config files containing credentials to git
- **Check file permissions** if using config file mode

### What the plugin does NOT do:

- ✅ Does not send credentials to any third-party servers
- ✅ Only fetches data from `opencode.ai` domain
- ✅ Does not log or expose your auth cookie
- ✅ HTTPS only for all requests

## License

MIT