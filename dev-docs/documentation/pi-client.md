# Pi Client Module

## Purpose
Communicates with Pi bot via tmux RPC interface, handling the complexities of JSON transmission through multiple SSH hops.

## The Challenge

Sending JSON to Pi through two SSH hops presents several problems:
1. **Quote escaping** — Shells interpret quotes differently
2. **Newline handling** — `echo` adds newlines that break JSON
3. **Special characters** — JSON contains braces, quotes, colons that shells interpret

## Solution: Base64 Encoding

Instead of trying to escape JSON for shell safety, we base64 encode it:

```javascript
const base64 = Buffer.from(messageJson).toString('base64')
// Decode on Pi: echo <base64> | base64 -d
```

This ensures:
- No quote escaping needed
- No newline issues
- Safe transmission through any shell

## Message Submission

After loading the JSON into tmux buffer and pasting, Pi needs an Enter keypress to process it:

```javascript
// 1. Decode base64 and load into tmux buffer
echo ${base64} | base64 -d | tmux load-buffer -

// 2. Paste into Pi's session
tmux paste-buffer -t pi-bot

// 3. Submit with Enter key
tmux send-keys -t pi-bot Enter
```

## RPC Protocol

Pi understands these message types:

### Prompt
```json
{"type": "prompt", "message": "Your task here", "working_dir": "/path"}
```

### Get State
```json
{"type": "get_state"}
```

### Abort
```json
{"type": "abort"}
```

## Error Handling

| Error | Cause | Handling |
|-------|-------|----------|
| Parse error | Malformed JSON | Check base64 encoding |
| Connection refused | Pi not running | Report clear error |
| Tmux not found | Session doesn't exist | Suggest restart |

## Lessons Learned

1. **Don't use `echo`** — Use `printf %s` to avoid newlines
2. **Always send Enter** — Pi won't process until Enter is pressed
3. **Base64 is reliable** — Avoids all shell escaping issues
4. **Check tmux session exists** — Before attempting to send

## Future Improvements

- [ ] WebSocket alternative for real-time communication
- [ ] Message queue for reliability
- [ ] Heartbeat detection for Pi crashes
