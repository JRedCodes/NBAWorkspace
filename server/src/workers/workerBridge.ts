import { spawn } from 'child_process'
import path from 'path'

const WORKERS_DIR = path.join(__dirname, '../../../workers')

export const workerBridge = {
  run(script: string, data?: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = data ? [JSON.stringify(data)] : []
      const proc = spawn('python3', [path.join(WORKERS_DIR, script), ...args])

      proc.stdout.on('data', (d: Buffer) => console.log(`[${script}]`, d.toString().trim()))
      proc.stderr.on('data', (d: Buffer) => console.error(`[${script}]`, d.toString().trim()))

      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Worker ${script} exited with code ${code}`))
      })
    })
  },
}
