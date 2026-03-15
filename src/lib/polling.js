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
  // Pi completes when it outputs turn_end and then goes idle
  // (no new turn_start for a while)
  const turnEndIndex = lines.findLastIndex(line => line.includes('"type":"turn_end"'))
  const turnStartIndex = lines.findLastIndex(line => line.includes('"type":"turn_start"'))

  // Complete if last turn_end is after last turn_start (Pi is idle)
  const isComplete = turnEndIndex !== -1 && turnEndIndex > turnStartIndex

  return {
    complete: isComplete,
    error: false,
    output: output.slice(-500) // Last 500 chars for context
  }
}
