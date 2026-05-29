import { mkdirSync } from 'node:fs'
import path from 'node:path'

export type ServerConfig = {
  coursesDir: string
  dataDir: string
  databasePath: string
}

function resolveFromRoot(value: string) {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), value)
}

export function getServerConfig(): ServerConfig {
  const dataDir = resolveFromRoot(process.env.DATA_DIR || './data')

  return {
    coursesDir: resolveFromRoot(process.env.COURSES_DIR || './courses'),
    dataDir,
    databasePath: path.resolve(
      /*turbopackIgnore: true*/ process.cwd(),
      process.env.DATABASE_PATH || path.join(dataDir, 'course-player.sqlite'),
    ),
  }
}

export function ensureDataDir() {
  mkdirSync(getServerConfig().dataDir, { recursive: true })
}
