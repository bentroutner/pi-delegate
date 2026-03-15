# Pi Task: Express.js Random Emoji API

## Objective
Create a simple Express.js application with a GET endpoint that returns a random emoji.

## Requirements

### 1. Project Setup
- Create directory: `/home/ben/pi-express`
- Initialize Node.js project with `npm init -y`
- Install dependencies: `express`
- Set `"type": "module"` in package.json

### 2. Express App (`src/index.js`)
Create an Express server with:
- Port: 3000
- One GET endpoint: `GET /emoji`
- Returns JSON: `{ "emoji": "🎉" }` (random emoji each request)

### 3. Emoji Selection
Use this array of emojis, pick one randomly:
```javascript
const emojis = ['🎉', '🚀', '🔥', '💯', '⭐', '🌟', '✨', '💫', '🎊', '🎈']
```

### 4. Code Style
Follow node.js-style conventions:
- 2 spaces indentation
- No semicolons
- Single quotes
- const/let only (no var)
- Arrow functions
- camelCase naming

### 5. Testing
After creating, test with:
```bash
node src/index.js &
curl http://localhost:3000/emoji
# Should return: {"emoji":"🚀"} (random each time)
kill %1  # Stop the server
```

### 6. Git Workflow
- Initialize git repo
- Use master branch
- Commit with message: "feat: add random emoji API"

## Files to Create
- `package.json` (modified)
- `src/index.js` (main app)

## Success Criteria
- [ ] Server starts without errors
- [ ] `curl http://localhost:3000/emoji` returns random emoji JSON
- [ ] Code follows style conventions
- [ ] Committed to master branch

Report back:
1. Did the server start successfully?
2. What emoji did curl return?
3. Any style convention issues?
