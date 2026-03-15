# File Transfer Module

## Purpose
Handles secure two-stage file transfer from Ben's computer to Pi server via the jump server, with automatic cleanup to preserve disk space.

## Why Two-Stage Transfer?

The network is segmented:
- Ben's computer can reach jump server (192.168.1.101)
- Jump server can reach Pi server (192.168.0.129)
- Ben's computer cannot reach Pi server directly

Solution: Ben → Jump → Pi

## Architecture

```
Local File → SCP → Jump Server (/tmp/) → SCP → Pi Server → Cleanup Jump
```

## Key Features

### Automatic Directory Creation
The module creates the destination directory on Pi if it doesn't exist:
```javascript
const mkdirCommand = `... mkdir -p ${remoteDir}`
```

### Guaranteed Cleanup
Uses `try/finally` to ensure temp files are removed from jump server even if transfer fails:
```javascript
try {
  await execAsync(stage1)  // To jump
  await execAsync(stage2)  // To Pi
} finally {
  await execAsync(cleanup) // Always cleanup
}
```

### Unique Temp Paths
Uses timestamp to avoid collisions:
```javascript
const tempPath = `/tmp/pi-delegate-${Date.now()}-${filename}`
```

## Security Considerations

- Uses `sshpass` for automated password entry
- Disables host key checking for LAN environment
- Temp files are removed immediately after use
- Jump server disk space (11GB) is preserved

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Large files | Standard SCP, no size limits |
| Network interruption | Error propagates to caller |
| Jump server full | SCP fails with clear error |
| Directory doesn't exist | Auto-created with mkdir -p |
| Cleanup fails | Warning logged, operation continues |

## Future Improvements

- [ ] Retry logic for transient network failures
- [ ] Progress bar for large file transfers
- [ ] Checksum verification for integrity
- [ ] SFTP alternative for better performance
