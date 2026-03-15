import { loadConfig } from '../lib/config-loader.js'
import { transferToPi } from '../lib/file-transfer.js'
import { sendToPi, isPiRunning } from '../lib/pi-client.js'
import { pollUntilComplete } from '../lib/polling.js'
import path from 'path'

/**
 * Delegate a task to Pi bot
 * @param {Object} options - CLI options
 */
export async function delegateCommand (options) {
  const verbose = options.verbose || process.env.VERBOSE === 'true'
  const dryRun = options.dryRun || process.env.DRY_RUN === 'true'

  try {
    // Load configuration
    const config = loadConfig()
    if (verbose) {
      console.log('Configuration loaded')
      console.log(`  Jump: ${config.jump.user}@${config.jump.host}`)
      console.log(`  Pi: ${config.pi.user}@${config.pi.host}`)
      console.log(`  Working dir: ${config.pi.workingDir}`)
    }

    // Check if Pi is running
    console.log('Checking Pi bot status...')
    const piRunning = await isPiRunning(config)
    if (!piRunning) {
      console.error('Error: Pi bot is not running')
      console.error('Start Pi with: tmux new-session -d -s pi-bot && tmux send-keys -t pi-bot "pi --mode rpc --no-session" Enter')
      process.exit(1)
    }
    console.log('Pi bot is running')

    // Transfer task file
    const taskFile = path.resolve(options.task)
    const remoteTaskPath = path.join(config.pi.workingDir, path.basename(taskFile))

    console.log('Transferring task file to Pi...')
    await transferToPi(taskFile, remoteTaskPath, config, dryRun)
    console.log('Task file transferred')

    // Send task to Pi
    console.log('Sending task to Pi bot...')
    const message = {
      type: 'prompt',
      message: `Read ${remoteTaskPath} and follow the instructions`,
      working_dir: config.pi.workingDir
    }

    await sendToPi(message, config, dryRun)
    console.log('Task sent to Pi bot')

    if (dryRun) {
      console.log('\n[Dry run complete - no actual changes made]')
      return
    }

    // Poll for completion
    console.log(`\nPolling Pi bot every ${config.polling.intervalSeconds} seconds...`)
    console.log('Press Ctrl+C to stop polling and check status manually\n')

    const result = await pollUntilComplete(
      config,
      (attempt, status, output) => {
        const statusText = status.isIdle ? 'Idle (likely complete)' : 'Still working...'
        console.log(`Poll ${attempt}/${config.polling.maxAttempts}: ${statusText}`)
        if (verbose && output) {
          console.log('--- Recent output ---')
          console.log(output.slice(-300))
          console.log('---------------------\n')
        }
      }
    )

    console.log('\n✓ Pi bot has completed the task')
    if (result.output) {
      console.log('\nFinal output:')
      console.log(result.output)
    }
  } catch (err) {
    console.error(`\n✗ Error: ${err.message}`)
    if (verbose) {
      console.error(err.stack)
    }
    process.exit(1)
  }
}
