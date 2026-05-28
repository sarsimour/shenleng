import { createClient } from "@libsql/client";

const databaseURL = process.env.DATABASE_URI;

if (!databaseURL) {
  console.error("DATABASE_URI is required.");
  process.exit(1);
}

const db = createClient({ url: databaseURL });

async function executeIgnoringDuplicateColumn(sql) {
  try {
    await db.execute(sql);
  } catch (error) {
    if (!String(error?.message || error).includes("duplicate column name")) {
      throw error;
    }
  }
}

const statements = [
  `CREATE TABLE IF NOT EXISTS site_access_logs (
    id INTEGER PRIMARY KEY NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'request_seen',
    source TEXT,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    query TEXT,
    status_code numeric,
    duration_ms numeric,
    referrer TEXT,
    referrer_host TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    bot_type TEXT,
    bot_name TEXT,
    is_bot INTEGER,
    is_search_bot INTEGER,
    is_a_i_bot INTEGER,
    device_type TEXT,
    country TEXT,
    region TEXT,
    request_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  "ALTER TABLE visitor_events ADD COLUMN bot_type TEXT",
  "ALTER TABLE visitor_events ADD COLUMN bot_name TEXT",
  "ALTER TABLE visitor_events ADD COLUMN is_bot INTEGER",
  "ALTER TABLE visitor_events ADD COLUMN device_type TEXT",
  "ALTER TABLE payload_locked_documents_rels ADD COLUMN site_access_logs_id INTEGER",
  "CREATE INDEX IF NOT EXISTS site_access_logs_event_type_idx ON site_access_logs (event_type)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_source_idx ON site_access_logs (source)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_method_idx ON site_access_logs (method)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_path_idx ON site_access_logs (path)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_status_code_idx ON site_access_logs (status_code)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_referrer_host_idx ON site_access_logs (referrer_host)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_ip_hash_idx ON site_access_logs (ip_hash)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_bot_type_idx ON site_access_logs (bot_type)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_bot_name_idx ON site_access_logs (bot_name)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_is_bot_idx ON site_access_logs (is_bot)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_is_search_bot_idx ON site_access_logs (is_search_bot)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_is_a_i_bot_idx ON site_access_logs (is_a_i_bot)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_device_type_idx ON site_access_logs (device_type)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_country_idx ON site_access_logs (country)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_region_idx ON site_access_logs (region)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_request_id_idx ON site_access_logs (request_id)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_created_at_idx ON site_access_logs (created_at)",
  "CREATE INDEX IF NOT EXISTS site_access_logs_updated_at_idx ON site_access_logs (updated_at)",
  "CREATE INDEX IF NOT EXISTS visitor_events_bot_type_idx ON visitor_events (bot_type)",
  "CREATE INDEX IF NOT EXISTS visitor_events_bot_name_idx ON visitor_events (bot_name)",
  "CREATE INDEX IF NOT EXISTS visitor_events_is_bot_idx ON visitor_events (is_bot)",
  "CREATE INDEX IF NOT EXISTS visitor_events_device_type_idx ON visitor_events (device_type)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_site_access_logs_id_idx ON payload_locked_documents_rels (site_access_logs_id)",
];

for (const statement of statements) {
  await executeIgnoringDuplicateColumn(statement);
}

console.log("Runtime analytics schema ensured.");
