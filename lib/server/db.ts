import { DatabaseSync } from 'node:sqlite'
import { ensureDataDir, getServerConfig } from './config'
import { initializeSchema } from './schema'

let database: DatabaseSync | undefined

export function getDb() {
  if (!database) {
    ensureDataDir()
    database = new DatabaseSync(getServerConfig().databasePath)
    initializeSchema(database)
  }

  return database
}
