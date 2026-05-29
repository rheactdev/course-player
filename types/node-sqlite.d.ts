declare module 'node:sqlite' {
  export type SqlValue = string | number | bigint | null | Uint8Array

  export class StatementSync {
    run(...anonymousParameters: SqlValue[]): { changes: number; lastInsertRowid: number | bigint }
    run(namedParameters: Record<string, SqlValue>): { changes: number; lastInsertRowid: number | bigint }
    get(...anonymousParameters: SqlValue[]): unknown
    get(namedParameters: Record<string, SqlValue>): unknown
    all(...anonymousParameters: SqlValue[]): unknown[]
    all(namedParameters: Record<string, SqlValue>): unknown[]
  }

  export class DatabaseSync {
    constructor(path: string)
    close(): void
    exec(sql: string): void
    prepare(sql: string): StatementSync
  }
}
