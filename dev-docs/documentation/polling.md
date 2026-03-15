# Polling Module

## Purpose
Monitors Pi bot progress by periodically checking tmux output and detecting when tasks complete.

## The Challenge

Pi doesn't send a "done" notification. We must infer completion from output patterns:
- Pi outputs JSON-RPC messages
- Tool execution results appear inline
- Completion is indicated by `turn_end` message

## Completion Detection

Pi's conversation flow:
```
turn_start → [processing] → turn_end → [idle] → turn_start → ...
```

Task is complete when:
- Last `turn_end` is after last `turn_start`
- Pi has returned to idle state

```javascript
const turnEndIndex = lines.findLastIndex(line => line.includes('"type":"turn_end"'))
const turnStartIndex = lines.findLastIndex(line => line.includes('"type":"turn_start"'))
const isComplete = turnEndIndex !== -1 && turnEndIndex > turnStartIndex
```

## Error Detection

**Important distinction:**
- **Tool errors** — Normal (bash command fails, file not found)
- **System errors** — Pi crashed or malfunctioned

Only system errors should stop polling:
```javascript
const hasSystemError = lines.some(line =>
  line.includes('"type":"error"') &&
  !line.includes('"command":"')  // Exclude tool results
)
```

## Polling Strategy

Default: 180 seconds (3 minutes) between checks
- Frequent enough to catch completion quickly
- Infrequent enough to not interrupt Pi's work
- Based on observed Pi task duration (15-30 min typical)

## Configuration

```javascript
{
  polling: {
    intervalSeconds: 180,  // 3 minutes
    maxAttempts: 20        // 60 minutes max
  }
}
```

## Lessons Learned

1. **Don't be too aggressive on errors** — Tool failures are normal
2. **Use `findLastIndex`** — Only the last turn matters
3. **Wait between polls** — Pi needs uninterrupted time
4. **Max attempts prevents infinite loops** — But warn user Pi may still be working

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Pi crashes mid-task | Detected as system error |
| Very long task | Max attempts reached, warn user |
| Network interruption | Error propagates to caller |
| Pi restarted during polling | New turn_start detected, continues |

## Future Improvements

- [ ] Adaptive polling (faster when Pi is active)
- [ ] Webhook notification instead of polling
- [ ] Progress estimation based on output patterns
