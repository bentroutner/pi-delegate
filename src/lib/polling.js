import { capturePiOutput } from './pi-client.js'

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Poll Pi bot until task completes or max attempts reached
 * @param {Object} config - Configuration object
 * @param {Function} onPoll - Callback for each poll (attempt, output)
 * @returns {Promise<Object>} Final status
 */
export async function pollUntilComplete (config, onPoll = () => {}) {
  const { intervalSeconds, maxAttempts } = config.polling

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait between polls
    if (attempt > 1) {
      await sleep(intervalSeconds * 1000)
    }

    const output = await capturePiOutput(config)
    const status = parsePiStatus(output)

    onPoll(attempt, status, output)

    if (status.complete) {
      return status
    }

    if (status.error) {
      throw new Error(`Pi bot reported error: ${status.errorMessage}`)
    }
  }

  throw new Error(`Max polling attempts (${maxAttempts}) reached. Pi may still be working.`)
}

/**
 * Parse Pi bot status from tmux output
 * Looks for completion markers in Pi's JSON responses
 * @param {string} output - Tmux session output
 * @returns {Object} Status object
 */
function parsePiStatus (output) {
  // Look for completion indicators in Pi's output
  const lines = output.split('\n')

  // Check for Pi system errors (not tool execution errors)
  // Tool errors (isError in tool results) are normal - Pi handles them
  // System errors indicate Pi itself crashed
  const hasSystemError = lines.some(line =>
    line.includes('"type":"error"') &&
    !line.includes('"command":"') // Exclude tool result errors
  )

  if (hasSystemError) {
    const errorLine = lines.find(line =>
      line.includes('"type":"error"') && !line.includes('"command":"')
    )
    return {
      complete: false,
      error: true,
      errorMessage: errorLine || 'Unknown system error'
    }
  }

  // Check for completion markers
  // Pi completes when it outputs a turn_end after processing the task
  // Look for the pattern: user message → assistant response → turn_end

  // Find the last user message (our prompt)
  const userMessageIndex = lines.findLastIndex(line =>
    line.includes('"role":"user"') && line.includes('"type":"message"')
  )

  // Find turn_end markers after the user message
  const turnEndsAfterMessage = lines
    .slice(userMessageIndex)
    .filter(line => line.includes('"type":"turn_end"'))

  // Find turn_start markers after the user message
  const turnStartsAfterMessage = lines
    .slice(userMessageIndex)
    .filter(line => line.includes('"type":"turn_start"'))

  // Complete if we have more turn_ends than turn_starts after our message
  // This means Pi has finished processing and returned to idle
  const isComplete = userMessageIndex !== -1 &&
    turnEndsAfterMessage.length > turnStartsAfterMessage.length

  return {
    complete: isComplete,
    error: false,
    output: output.slice(-500) // Last 500 chars for context
  }
}
