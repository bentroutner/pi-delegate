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

  // Check for error markers
  const hasError = lines.some(line =>
    line.includes('"isError":true') ||
    line.includes('"type":"error"')
  )

  if (hasError) {
    const errorLine = lines.find(line =>
      line.includes('"isError":true') || line.includes('"type":"error"')
    )
    return {
      complete: false,
      error: true,
      errorMessage: errorLine || 'Unknown error'
    }
  }

  // Check for completion markers
  // Pi typically outputs turn_end or completion messages
  const isComplete = lines.some(line =>
    line.includes('"type":"turn_end"') &&
    !lines.slice(lines.indexOf(line) + 1).some(l => l.includes('"type":"turn_start"'))
  )

  return {
    complete: isComplete,
    error: false,
    output: output.slice(-500) // Last 500 chars for context
  }
}
