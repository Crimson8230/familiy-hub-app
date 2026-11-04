CREATE TABLE school_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_display_name TEXT NOT NULL CHECK(length(child_display_name) > 0),
  child_key TEXT NOT NULL UNIQUE CHECK(length(child_key) > 0),
  school_code TEXT NOT NULL CHECK(school_code IN ('grundschule', 'mittelschule')),
  username TEXT NOT NULL CHECK(length(username) > 0),
  password TEXT NOT NULL CHECK(length(password) > 0)
);
CREATE TABLE legacy_migration (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  source_version INTEGER NOT NULL CHECK(source_version = 1),
  account_count INTEGER NOT NULL CHECK(account_count >= 0),
  status TEXT NOT NULL CHECK(status IN ('imported', 'complete'))
);
