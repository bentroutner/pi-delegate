# Configuration System

## Purpose
Manages credentials and settings via environment variables using dotenv.

## Why dotenv?

- **Simple** — No complex config file parsing
- **Standard** — Widely understood pattern
- **Secure** — Easy to gitignore, hard to accidentally commit
- **Flexible** — Can override with actual env vars

## Configuration Hierarchy

1. Environment variables (highest priority)
2. `.env` file
3. Default values (lowest priority)

## Required Configuration

```bash
# Jump Server (intermediate hop)
JUMP_HOST=192.168.1.101
JUMP_USER=ben
JUMP_PASSWORD=your-password

# Pi Server (where Pi bot runs)
PI_HOST=192.168.0.129
PI_USER=ben
PI_PASSWORD=your-password
```

## Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PI_TMUX_SESSION` | `pi-bot` | Tmux session name |
| `PI_WORKING_DIR` | `/home/ben/pi-workspace` | Default working directory |
| `POLL_INTERVAL_SECONDS` | `180` | Seconds between polls |
| `MAX_POLL_ATTEMPTS` | `20` | Maximum polling attempts |
| `VERBOSE` | `false` | Enable detailed logging |
| `DRY_RUN` | `false` | Show commands without executing |

## Validation

Configuration is validated at startup:
- Required fields must be present
- Clear error messages for missing config
- Suggests checking `.env` file

## Security

- `.env` file is gitignored
- Passwords never logged
- File permissions should be 0600

## Future Improvements

- [ ] Encrypt passwords in .env
- [ ] Support multiple Pi profiles
- [ ] Config validation command
