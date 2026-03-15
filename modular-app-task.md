# Multi-Step Node.js Project

## Objective
Create a modular Node.js utility library with multiple components.

## Phase 1: Project Setup
- Create directory: `/home/ben/pi-modular`
- Initialize with `npm init -y`
- Set `"type": "module"`
- Install: `jest` as dev dependency

## Phase 2: Logger Module (`src/logger.js`)
Create a logger with:
- `log(message)` - prints timestamp + message
- `error(message)` - prints timestamp + ERROR + message
- Use ISO timestamps

## Phase 3: Calculator Module (`src/calculator.js`)
Create a calculator with:
- `add(a, b)` - returns sum
- `multiply(a, b)` - returns product
- Input validation (throw Error for non-numbers)

## Phase 4: Tests (`test/app.test.js`)
Write Jest tests:
- Test logger.log outputs timestamp
- Test calculator.add with valid inputs
- Test calculator.multiply throws on invalid input

## Phase 5: Integration (`src/index.js`)
Create main file that:
- Imports logger and calculator
- Logs "App starting"
- Calculates 5 + 3 and logs result
- Calculates 4 * 7 and logs result
- Logs "App complete"

## Style Requirements
- 2 spaces indentation
- No semicolons
- Single quotes
- const/let only
- JSDoc comments

## Git Workflow
- Initialize git
- Commit after each phase with descriptive messages
- Use master branch

## Verification
Run: `npm test` (should pass)
Run: `node src/index.js` (should show logs and calculations)

Report back after each phase.
