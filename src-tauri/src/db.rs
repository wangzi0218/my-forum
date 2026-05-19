use tauri_plugin_sql::{Migration, MigrationKind};

/// 返回数据库迁移列表，在应用启动时自动执行
pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "init_schema",
        sql: include_str!("../migrations/001_init.sql"),
        kind: MigrationKind::Up,
    }]
}
