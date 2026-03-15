#!/usr/bin/env node

import { program } from 'commander'
import { delegateCommand } from './commands/delegate.js'
import { statusCommand } from './commands/status.js'
import { configCommand } from './commands/config.js'

program
  .name('pi-delegate')
  .description('CLI tool for delegating tasks to Pi bot')
  .version('0.1.0')

program
  .command('delegate')
  .description('Delegate a task to Pi bot')
  .requiredOption('-t, --task <path>', 'Path to task file')
  .option('-r, --repo <path>', 'Local repo path to sync')
  .option('--poll-interval <seconds>', 'Seconds between checks', '180')
  .option('--max-polls <number>', 'Maximum polling attempts', '20')
  .option('-v, --verbose', 'Show detailed output')
  .option('--dry-run', 'Show what would happen without executing')
  .action(delegateCommand)

program
  .command('status')
  .description('Check Pi bot status')
  .action(statusCommand)

program
  .command('config')
  .description('Interactive configuration setup')
  .action(configCommand)

program.parse()
