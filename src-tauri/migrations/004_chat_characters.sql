-- 为 chat 表添加 character_ids 字段，记录参与对话的 NPC
ALTER TABLE chat ADD COLUMN character_ids TEXT NOT NULL DEFAULT '[]';
