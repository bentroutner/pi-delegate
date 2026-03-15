import { capturePiOutput, getPiState, restartPi } from './pi-client.js'

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Poll Pi bot until task completes or max attempts reached
 * Detects completion when output stops changing (Pi is idle)
 * Automatically manages Pi context window - restarts if stuck
 * @param {Object} config - Configuration object
 * @param {Function} onPoll - Callback for each poll (attempt, output, state)
 * @returns {Promise<Object>} Final status
 */
export async function pollUntilComplete (config, onPoll = () => {}) {
  const { intervalSeconds, maxAttempts } = config.polling

  let previousOutput = ''
  let unchangedCount = 0
  const requiredUnchanged = 2 // Output must be unchanged for 2 consecutive polls
  const tokenThreshold = 55000 // Restart Pi if tokens exceed this
  const stuckThreshold = 5 // Restart if unchanged for 5 polls (output may be stuck)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait between polls
    if (attempt > 1) {
      await sleep(intervalSeconds * 1000)
    }

    const output = await capturePiOutput(config)
    const status = parsePiStatus(output)

    // Check Pi state (token count)
    const piState = await getPiState(config)
    const tokenCount = piState?.tokenCount || 0

    // Check if output changed
    const outputChanged = output !== previousOutput
    if (!outputChanged) {
      unchangedCount++
    } else {
      unchangedCount = 0
      previousOutput = output
    }

    // Determine Pi state
    const isIdle = unchangedCount >= requiredUnchanged
    const isStuck = unchangedCount >= stuckThreshold
    const isContextFull = tokenCount > tokenThreshold

    onPoll(attempt, { ...status, isIdle, isStuck, isContextFull, tokenCount }, output)

    // Complete if idle and we saw our message
    if (isIdle && status.hasUserMessage) {
      return { complete: true, output }
    }

    // Handle Pi stuckness - restart if needed
    if (isStuck || isContextFull) {
      console.log(`\n⚠️  Pi appears stuck (${isStuck ? 'no progress' : 'context full'}). Restarting...`)
      await restartPi(config)
      console.log('✓ Pi restarted')
      unchangedCount = 0
      // Continue polling - task may need to be resent
      continue
    }

    if (status.error) {
      throw new Error(`Pi bot reported error: ${status.errorMessage}`)
    }
  }

  throw new Error(`Max polling attempts (${maxAttempts}) reached. Pi may still be working.`)
}

/**
 * Parse Pi bot status from tmux output
 * @param {string} output - Tmux session output
 * @returns {Object} Status object
 */
function parsePiStatus (output) {
  const lines = output.split('\n')

  // Check for Pi system errors (not tool execution errors)
  const hasSystemError = lines.some(line =>
    line.includes('"type":"error"') &&
    !line.includes('"command":"')
  )

  if (hasSystemError) {
    const errorLine = lines.find(line =>
      line.includes('"type":"error"') && !line.includes('"command":"')
    )
    return {
      complete: false,
      error: true,
      errorMessage: errorLine || 'Unknown system error',
      hasUserMessage: false
    }
  }

  // Check if our user message was received
  const hasUserMessage = lines.some(line =>
    line.includes('"role":"user"') && line.includes('Read')
  )

  return {
    complete: false,
    error: false,
    hasUserMessage
  }
}
