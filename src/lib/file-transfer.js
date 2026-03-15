import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

/**
 * Transfer a file to Pi via jump server
 * Automatically cleans up temp files on jump server
 * @param {string} localPath - Local file path
 * @param {string} remotePath - Destination path on Pi
 * @param {Object} config - Configuration object
 * @param {boolean} dryRun - If true, only log commands
 * @returns {Promise<void>}
 */
export async function transferToPi (localPath, remotePath, config, dryRun = false) {
  const filename = path.basename(localPath)
  const tempPath = `/tmp/pi-delegate-${Date.now()}-${filename}`
  const { jump, pi } = config

  const sshpassJump = `sshpass -p '${jump.password}'`
  const sshpassPi = `sshpass -p '${pi.password}'`

  // Stage 1: Local → Jump
  const stage1 = `${sshpassJump} scp -o StrictHostKeyChecking=no ${localPath} ${jump.user}@${jump.host}:${tempPath}`

  // Stage 2: Jump → Pi
  const stage2 = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "${sshpassPi} scp -o StrictHostKeyChecking=no ${tempPath} ${pi.user}@${pi.host}:${remotePath}"`

  // Stage 3: Cleanup (always run)
  const cleanup = `${sshpassJump} ssh -o StrictHostKeyChecking=no ${jump.user}@${jump.host} "rm -f ${tempPath}"`

  if (dryRun) {
    console.log('[DRY RUN] Would execute:')
    console.log(`  ${stage1}`)
    console.log(`  ${stage2}`)
    console.log(`  ${cleanup}`)
    return
  }

  try {
    // Stage 1: Copy to jump server
    await execAsync(stage1)

    // Stage 2: Copy from jump to Pi
    await execAsync(stage2)
  } finally {
    // Stage 3: Always cleanup jump server temp file
    // Jump server has limited disk space (11GB)
    try {
      await execAsync(cleanup)
    } catch (err) {
      console.warn(`Warning: Failed to cleanup temp file on jump server: ${err.message}`)
    }
  }
}
