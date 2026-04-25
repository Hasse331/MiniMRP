import { DatabaseSync } from "node:sqlite";
import { getDesktopDatabasePath } from "./files.ts";
import { ensureSqliteSchemaSql } from "./schema.ts";

let desktopDatabase: DatabaseSync | null = null;

export function createDesktopDatabase(filename: string) {
  const db = new DatabaseSync(filename);
  db.exec("pragma foreign_keys = on;");

  if (filename !== ":memory:") {
    db.exec("pragma journal_mode = wal;");
  }

  return db;
}

export function ensureSqliteSchema(db: DatabaseSync) {
  db.exec(ensureSqliteSchemaSql);
}

export function listSqliteTables(db: DatabaseSync) {
  return (db
    .prepare("select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name")
    .all() as Array<{ name: string }>)
    .map((row) => row.name);
}

export function getDesktopDatabase() {
  if (!desktopDatabase) {
    desktopDatabase = createDesktopDatabase(getDesktopDatabasePath());
    ensureSqliteSchema(desktopDatabase);
  }

  return desktopDatabase;
}

export function resetDesktopDatabaseForTests() {
  desktopDatabase?.close();
  desktopDatabase = null;
}
