import 'dotenv/config'

/**
 * Load configuration from environment variables
 * @returns {Object} Configuration object
 */
export function loadConfig () {
  const config = {
    jump: {
      host: process.env.JUMP_HOST,
      user: process.env.JUMP_USER,
      password: process.env.JUMP_PASSWORD
    },
    pi: {
      host: process.env.PI_HOST,
      user: process.env.PI_USER,
      password: process.env.PI_PASSWORD,
      tmuxSession: process.env.PI_TMUX_SESSION || 'pi-bot',
      workingDir: process.env.PI_WORKING_DIR || '/home/ben/pi-workspace'
    },
    polling: {
      intervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS || '180', 10),
      maxAttempts: parseInt(process.env.MAX_POLL_ATTEMPTS || '20', 10)
    },
    verbose: process.env.VERBOSE === 'true',
    dryRun: process.env.DRY_RUN === 'true'
  }

  validateConfig(config)
  return config
}

/**
 * Validate required configuration
 * @param {Object} config - Configuration object
 * @throws {Error} If required config is missing
 */
function validateConfig (config) {
  const required = [
    ['jump.host', config.jump.host],
    ['jump.user', config.jump.user],
    ['jump.password', config.jump.password],
    ['pi.host', config.pi.host],
    ['pi.user', config.pi.user],
    ['pi.password', config.pi.password]
  ]

  const missing = required
    .filter(([_, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.join(', ')}\n` +
      'Please check your .env file or environment variables.'
    )
  }
}
