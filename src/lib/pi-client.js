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
  // Use printf to avoid adding newlines, then send Enter key to submit
  const sendCommand = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'printf %s ${base64} | base64 -d | tmux load-buffer - && tmux paste-buffer -t ${pi.tmuxSession} && tmux send-keys -t ${pi.tmuxSession} Enter'"`

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

/**
 * Get Pi bot state including token count
 * @param {Object} config - Configuration object
 * @returns {Promise<Object|null>} Pi state or null if error
 */
export async function getPiState (config) {
  try {
    const { jump, pi } = config
    const sshpassJump = `sshpass -p '${jump.password}'`

    // Send get_state command and capture response
    const stateMessage = { type: 'get_state' }
    const base64 = Buffer.from(JSON.stringify(stateMessage)).toString('base64')

    const sendCommand = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'printf %s ${base64} | base64 -d | tmux load-buffer - && tmux paste-buffer -t ${pi.tmuxSession} && tmux send-keys -t ${pi.tmuxSession} Enter'"`

    await execAsync(sendCommand)

    // Wait a moment for response
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Capture output to find state response
    const output = await capturePiOutput(config)

    // Parse state from output
    const stateMatch = output.match(/"totalTokens":(\d+)/)
    const tokenCount = stateMatch ? parseInt(stateMatch[1], 10) : 0

    return { tokenCount }
  } catch {
    return null
  }
}

/**
 * Restart Pi bot session
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function restartPi (config) {
  const { jump, pi } = config
  const sshpassJump = `sshpass -p '${jump.password}'`

  const restartCommand = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassJump} ssh -o StrictHostKeyChecking=no ${pi.user}@${pi.host} 'tmux kill-session -t ${pi.tmuxSession} 2>/dev/null; tmux new-session -d -s ${pi.tmuxSession} && tmux send-keys -t ${pi.tmuxSession} \\"pi --mode rpc --no-session\\" Enter'"`

  await execAsync(restartCommand)

  // Wait for Pi to start
  await new Promise(resolve => setTimeout(resolve, 3000))
}
