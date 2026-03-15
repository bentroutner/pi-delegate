# Pi-Delegate CLI Tool - Plan

## Overview
A command-line tool to streamline delegation of coding tasks to Pi bot, handling the full workflow: file transfer, task submission, progress polling, and result reporting.

## Problem Statement
Current workflow involves manual, error-prone steps:
1. Copy task files via multi-hop SCP (Ben → Jump → Pi)
2. Carefully craft JSON-escaped messages for Pi's RPC interface
3. Manually poll every 3 minutes to check progress
4. No notification when Pi completes

## Goals
- **One-command delegation**: `pi-delegate --task task.md`
- **Reliable file transfer**: Handle jump-server hops automatically
- **Safe communication**: No manual JSON escaping
- **Smart polling**: Automatic 3-minute intervals, report on completion
- **Error handling**: Clear feedback when things go wrong

## Architecture

### Core Components

```
pi-delegate/
├── src/
│   ├── index.js              # CLI entry point
│   ├── commands/
│   │   └── delegate.js       # Main delegation command
│   ├── lib/
│   │   ├── file-transfer.js  # SCP via jump server
│   │   ├── pi-client.js      # Pi bot RPC communication
│   │   ├── polling.js        # Progress monitoring
│   │   └── config.js         # Settings & credentials
│   └── utils/
│       ├── ssh.js            # SSH command helpers
│       └── logger.js         # Consistent output
├── bin/
│   └── pi-delegate           # Executable
├── config/
│   └── default.json          # Default configuration
├── package.json
└── README.md
```

### Data Flow

```
User runs: pi-delegate --task task.md --repo ./my-project

1. Validate task file exists
2. Transfer task.md → Jump → Pi (via SCP)
3. Send RPC command to Pi bot (via tmux)
4. Poll every 3 minutes:
   - Check tmux session output
   - Parse Pi's JSON responses
   - Detect completion/failure
5. Report results to user
```

## Configuration

### Config File (`~/.config/pi-delegate/config.json`)
```json
{
  "jump": {
    "host": "192.168.1.101",
    "user": "ben",
    "passwordFile": "~/.config/pi-delegate/jump-pass"
  },
  "pi": {
    "host": "192.168.0.129",
    "user": "ben",
    "passwordFile": "~/.config/pi-delegate/pi-pass",
    "tmuxSession": "pi-bot",
    "workingDir": "/home/ben/pi-workspace"
  },
  "polling": {
    "intervalSeconds": 180,
    "maxAttempts": 20
  }
}
```

### Environment Variables
- `PI_DELEGATE_CONFIG` — Path to config file
- `PI_JUMP_PASSWORD` — Jump server password (optional)
- `PI_PASSWORD` — Pi server password (optional)

## CLI Interface

### Commands

#### `delegate` (default)
```bash
pi-delegate --task task.md [options]

Options:
  --task, -t        Path to task file (required)
  --repo, -r        Local repo path to sync (optional)
  --poll-interval   Seconds between checks (default: 180)
  --max-polls       Maximum polling attempts (default: 20)
  --verbose, -v     Show detailed output
  --dry-run         Show what would happen, don't execute
```

#### `status`
```bash
pi-delegate status

Show current Pi bot status:
- Is Pi running?
- Current task (if any)
- Last output snippet
```

#### `config`
```bash
pi-delegate config

Interactive setup wizard for configuration.
```

## Implementation Details

### File Transfer Module

Uses `sshpass` + `scp` for two-stage transfer:

```javascript
async function transferToPi(localPath, remotePath) {
  // Stage 1: Local → Jump
  await scp(localPath, `${jumpUser}@${jumpHost}:/tmp/`)
  
  // Stage 2: Jump → Pi (via SSH command)
  await ssh(jumpHost, 
    `scp /tmp/${filename} ${piUser}@${piHost}:${remotePath}`)
}
```

### Pi Client Module

Communicates via tmux send-keys:

```javascript
async function sendToPi(message) {
  // Escape message for safe shell insertion
  const escaped = escapeShellArg(JSON.stringify(message))
  
  // Load into tmux buffer and paste
  await tmuxCommand(`load-buffer - <<< ${escaped}`)
  await tmuxCommand(`paste-buffer -t ${tmuxSession}`)
}
```

### Polling Module

```javascript
async function pollUntilComplete() {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalSeconds * 1000)
    
    const output = await captureTmuxOutput()
    const status = parsePiStatus(output)
    
    if (status.complete) {
      return status
    }
    
    if (status.error) {
      throw new Error(status.errorMessage)
    }
    
    log(`Poll ${i + 1}/${maxAttempts}: Still working...`)
  }
  
  throw new Error('Max polling attempts reached')
}
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Task file not found | Clear error, exit code 1 |
| SCP fails | Retry once, then error with details |
| Pi not running | Error with restart instructions |
| JSON parse error in Pi output | Log raw output, continue polling |
| Max polls reached | Error with suggestion to check manually |
| Network timeout | Retry with exponential backoff |

## Security Considerations

1. **Password storage**: Use files with 0600 permissions, not command-line args
2. **No logging of passwords**: Sanitize all output
3. **SSH host key checking**: Disabled for LAN (configurable)
4. **Temp file cleanup**: Remove files from jump server after transfer

## Testing Strategy

1. **Unit tests**: Mock SSH/SCP commands
2. **Integration tests**: Test against actual Pi server (optional)
3. **Dry-run mode**: Verify commands without executing

## Future Enhancements

- [ ] Skill auto-sync before delegation
- [ ] GitHub integration (auto-clone repos on Pi)
- [ ] Notification hooks (webhook on completion)
- [ ] Parallel task delegation
- [ ] Task queue management

## Milestones

### MVP (Week 1)
- [ ] Basic `delegate` command
- [ ] File transfer via jump server
- [ ] Pi RPC communication
- [ ] Simple polling loop
- [ ] Basic error handling

### v1.0 (Week 2)
- [ ] `status` and `config` commands
- [ ] Configuration file support
- [ ] Verbose logging
- [ ] Dry-run mode
- [ ] README and documentation

### v1.1 (Future)
- [ ] Skill sync integration
- [ ] Notification webhooks
- [ ] Task templates
