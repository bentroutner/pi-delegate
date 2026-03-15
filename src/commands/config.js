import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Interactive configuration setup
 */
export async function configCommand () {
  console.log('Pi-Delegate Configuration Setup')
  console.log('================================\n')

  // Read example file
  const examplePath = path.join(__dirname, '..', '..', '.env.example')
  const example = await fs.readFile(examplePath, 'utf8')

  console.log('Configuration is managed via .env file')
  console.log('\n1. Copy .env.example to .env:')
  console.log('   cp .env.example .env')
  console.log('\n2. Edit .env with your actual values:')
  console.log('\n--- .env.example ---')
  console.log(example)
  console.log('--------------------\n')
  console.log('Required values:')
  console.log('  - JUMP_HOST, JUMP_USER, JUMP_PASSWORD')
  console.log('  - PI_HOST, PI_USER, PI_PASSWORD')
  console.log('\nOptional values (have defaults):')
  console.log('  - PI_TMUX_SESSION (default: pi-bot)')
  console.log('  - PI_WORKING_DIR (default: /home/ben/pi-workspace)')
  console.log('  - POLL_INTERVAL_SECONDS (default: 180)')
  console.log('  - MAX_POLL_ATTEMPTS (default: 20)')
}
