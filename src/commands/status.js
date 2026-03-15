import { loadConfig } from '../lib/config-loader.js'
import { isPiRunning, capturePiOutput } from '../lib/pi-client.js'

/**
 * Check Pi bot status
 */
export async function statusCommand () {
  try {
    const config = loadConfig()

    console.log('Pi-Delegate Status')
    console.log('==================\n')

    // Check if Pi is running
    const running = await isPiRunning(config)
    console.log(`Pi bot: ${running ? '✓ Running' : '✗ Not running'}`)

    if (running) {
      // Get recent output
      console.log('\nRecent output:')
      console.log('--------------')
      const output = await capturePiOutput(config)
      // Show last 20 lines
      const lines = output.split('\n').slice(-20)
      console.log(lines.join('\n'))
    } else {
      console.log('\nTo start Pi bot:')
      console.log('  tmux new-session -d -s pi-bot')
      console.log('  tmux send-keys -t pi-bot "pi --mode rpc --no-session" Enter')
    }
  } catch (err) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}
