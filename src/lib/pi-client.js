import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Send a message to Pi bot via tmux
 * Uses base64 encoding to safely transfer JSON through SSH hops
 * @param {Object} message - Message object to send
 * @param {Object} config - Configuration object
 * @param {boolean} dryRun - If true, only log commands
 * @returns {Promise<void>}
 */
export async function sendToPi (message, config, dryRun = false) {
  const { jump, pi } = config
  const messageJson = JSON.stringify(message)

  // Base64 encode to safely pass through shells without escaping issues
  const base64 = Buffer.from(messageJson).toString('base64')

  const sshpassJump = `sshpass -p '${jump.password}'`

  // Decode base64 and load into tmux buffer, then paste
  // Use echo piped to base64 -d to avoid shell interpretation issues
  const sendCommand = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'echo ${base64} | base64 -d | tmux load-buffer - && tmux paste-buffer -t ${pi.tmuxSession}'"`

  if (dryRun) {
    console.log('[DRY RUN] Would send to Pi:')
    console.log(`  Message: ${messageJson}`)
    console.log(`  Base64: ${base64}`)
    return
  }

  // Send in one command: decode base64, load buffer, paste
  await execAsync(sendCommand)
}

/**
 * Capture output from Pi bot tmux session
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} Tmux session output
 */
export async function capturePiOutput (config) {
  const { jump, pi } = config
  const sshpassJump = `sshpass -p '${jump.password}'`

  const command = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'tmux capture-pane -t ${pi.tmuxSession} -p'"`

  const { stdout } = await execAsync(command)
  return stdout
}

/**
 * Check if Pi bot tmux session is running
 * @param {Object} config - Configuration object
 * @returns {Promise<boolean>}
 */
export async function isPiRunning (config) {
  try {
    const { jump, pi } = config
    const sshpassJump = `sshpass -p '${jump.password}'`

    const command = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'tmux has-session -t ${pi.tmuxSession}'"`

    await execAsync(command)
    return true
  } catch {
    return false
  }
}
