# Pi-Delegate

CLI tool for delegating coding tasks to Pi bot with automatic file transfer, task submission, and progress polling.

## Installation

```bash
npm install
```

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

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

## Usage

### Delegate a task

```bash
pi-delegate --task task.md
```

Options:
- `--task, -t` - Path to task file (required)
- `--repo, -r` - Local repo path to sync (optional)
- `--poll-interval` - Seconds between checks (default: 180)
- `--max-polls` - Maximum polling attempts (default: 20)
- `--verbose, -v` - Show detailed output
- `--dry-run` - Show what would happen without executing

### Check Pi status

```bash
pi-delegate status
```

### Configuration help

```bash
pi-delegate config
```

## How it works

1. **File Transfer** - Copies your task file via jump server to Pi
2. **Task Submission** - Sends the task to Pi bot via tmux RPC
3. **Polling** - Checks Pi status every 3 minutes until complete
4. **Cleanup** - Automatically removes temp files from jump server

## Requirements

- Node.js 18+
- `sshpass` installed on local machine
- Pi bot running in tmux session on Pi server
