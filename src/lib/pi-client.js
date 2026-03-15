import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Send a message to Pi bot via tmux
 * @param {Object} message - Message object to send
 * @param {Object} config - Configuration object
 * @param {boolean} dryRun - If true, only log commands
 * @returns {Promise<void>}
 */
export async function sendToPi (message, config, dryRun = false) {
  const { jump, pi } = config
  const messageJson = JSON.stringify(message)

  // Escape for shell safety
  const escaped = messageJson
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/\n/g, '\\n')

  const sshpassJump = `sshpass -p '${jump.password}'`

  // Load message into tmux buffer and paste to Pi session
  const loadBuffer = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'printf '%s' '${escaped}' | tmux load-buffer -'"`

  const pasteBuffer = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'tmux paste-buffer -t ${pi.tmuxSession}'"`

  if (dryRun) {
    console.log('[DRY RUN] Would send to Pi:')
    console.log(`  Message: ${messageJson}`)
    return
  }

  // Load buffer
  await execAsync(loadBuffer)

  // Paste to Pi session
  await execAsync(pasteBuffer)
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
