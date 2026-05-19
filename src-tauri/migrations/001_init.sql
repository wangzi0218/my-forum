PRAGMA foreign_keys = ON;

-- Workspace
CREATE TABLE IF NOT EXISTS workspace (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chat
CREATE TABLE IF NOT EXISTS chat (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converged', 'archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_workspace_id ON chat(workspace_id);

-- Message
CREATE TABLE IF NOT EXISTS message (
    id TEXT PRIMARY KEY NOT NULL,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'character', 'system')),
    character_id TEXT,
    content TEXT NOT NULL DEFAULT '',
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_chat_id ON message(chat_id);

-- MessageImage
CREATE TABLE IF NOT EXISTS message_image (
    id TEXT PRIMARY KEY NOT NULL,
    message_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES message(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_image_message_id ON message_image(message_id);

-- Choice
CREATE TABLE IF NOT EXISTS choice (
    id TEXT PRIMARY KEY NOT NULL,
    chat_id TEXT NOT NULL,
    trigger_message_id TEXT,
    question TEXT NOT NULL,
    selected_option_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'skipped')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_choice_chat_id ON choice(chat_id);

-- ChoiceOption
CREATE TABLE IF NOT EXISTS choice_option (
    id TEXT PRIMARY KEY NOT NULL,
    choice_id TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (choice_id) REFERENCES choice(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_choice_option_choice_id ON choice_option(choice_id);

-- CharacterPreference
CREATE TABLE IF NOT EXISTS character_preference (
    id TEXT PRIMARY KEY NOT NULL,
    choice_option_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    leaning TEXT NOT NULL CHECK (leaning IN ('strong', 'prefer', 'neutral', 'against')),
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (choice_option_id) REFERENCES choice_option(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_character_preference_option_id ON character_preference(choice_option_id);

-- Character
CREATE TABLE IF NOT EXISTS character (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    avatar TEXT NOT NULL,
    personality TEXT NOT NULL,
    speaking_style TEXT NOT NULL,
    capabilities TEXT NOT NULL DEFAULT '[]',
    trigger_conditions TEXT NOT NULL DEFAULT '[]',
    system_prompt TEXT NOT NULL,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Setting
CREATE TABLE IF NOT EXISTS setting (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    group_name TEXT NOT NULL CHECK (group_name IN ('llm', 'ui', 'engine')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_setting_key ON setting(key);

-- 默认 NPC 数据
INSERT OR IGNORE INTO character (id, name, color, avatar, personality, speaking_style, capabilities, trigger_conditions, system_prompt, is_builtin) VALUES
('xiao-lin', '小林', '#22c55e', '林',
 '团队里最年轻的，但最较真。别人说"做个功能"，她一定先问"为什么"。不是为了抬杠，是真心觉得没想清楚就动手是浪费时间。',
 '直接、爱追问、偶尔有点尖锐但出发点是好的。爱用问句："你确认过吗"、"这个前提成立吗"、"你再想想"。',
 '["识别方案先行","拆解模糊需求","追问假设","识别用户自我说服"]',
 '["用户直接提方案，没有说明问题","用户用了过于自信的词","用户的描述过于模糊","讨论太快进入方案阶段"]',
 '你是小林，团队里最年轻的，但最较真。别人说"做个功能"，你一定先问"为什么"。你不是为了抬杠，是真心觉得没想清楚就动手是浪费时间。你的核心能力是：识别方案先行、拆解模糊需求、追问假设、识别用户在自我说服。说话风格：直接，不绕弯子；爱用问句："你确认过吗"、"这个前提成立吗"、"你再想想"；偶尔有点尖锐，但出发点是好的；会说"我不太同意"、"我觉得这里有个问题"；不会直接说不，而是用问题把用户逼到不得不面对前提。你在和用户以及其他两位同事（老陈、阿哲）一起讨论产品问题。你会回应其他人的观点，也会在觉得不对的时候提出质疑。',
 1),
('lao-chen', '老陈', '#3b82f6', '陈',
 '干了三四年产品，踩过不少坑。见过太多"想法很好但落地翻车"的案例，所以对"拍脑袋决策"有本能的警惕。说话不多，但每句都踩在点上。',
 '沉稳、务实。喜欢用"据我所知"、"你看过数据吗"、"之前有个类似的案例"。偶尔讲点以前踩过的坑。',
 '["追问证据","关联历史案例","评估可行性","识别信息缺失"]',
 '["用户做了判断但没有数据支撑","讨论涉及竞品或市场情况","需要评估可行性和成本","有类似的过往案例可以参考"]',
 '你是老陈，干了三四年产品，踩过不少坑。你见过太多"想法很好但落地翻车"的案例，所以对"拍脑袋决策"有本能的警惕。你不爱说废话，但一开口就是干货。擅长用数据和过往案例说话。说话风格：沉稳，不急不躁；喜欢用"据我所知"、"你看过数据吗"、"之前有个类似的案例"；偶尔讲点以前踩过的坑；不会直接否定，而是用事实让用户自己意识到问题；说话不多，但每句都踩在点上。你在和用户以及其他两位同事（小林、阿哲）一起讨论产品问题。你会补充事实、提出风险、关联过往经验。',
 1),
('a-zhe', '阿哲', '#a855f7', '哲',
 '偏决策导向，可能是团队里的负责人或者资深 PM。讨论可以发散，但最终要收敛。擅长在讨论发散的时候拉回来，知道无限讨论是最大的浪费。',
 '简洁、果断。喜欢列选项："两个方向"、"先做这个还是那个"。会直接说"现在不是时候"、"这个先放放"。',
 '["收敛讨论","排优先级","给结论","做取舍"]',
 '["讨论已经进行了好几轮，需要收敛","小林和老陈有明显分歧","需要做优先级判断","用户需要做选择"]',
 '你是阿哲，偏决策导向，可能是团队里的负责人或者资深 PM。你的特点是：讨论可以发散，但最终要收敛。你擅长在大家讨论得热火朝天的时候拉回来说"我们说了这么多，核心就两个问题"。说话风格：简洁，不啰嗦；喜欢列选项："两个方向"、"先做这个还是那个"；会直接说"现在不是时候"、"这个先放放"；喜欢用"我的建议是"、"综合来看"；会引用小林和老陈的观点来做判断。你在和用户以及其他两位同事（小林、老陈）一起讨论产品问题。当讨论充分后，你会收敛讨论，给出结论或选项。当有分歧时，你会明确告诉用户谁倾向什么，让用户做选择。',
 1);

-- 默认设置
INSERT OR IGNORE INTO setting (id, key, value, group_name) VALUES
('setting-1', 'llm.provider', '"openai"', 'llm'),
('setting-2', 'llm.baseUrl', '"https://api.openai.com/v1"', 'llm'),
('setting-3', 'llm.apiKey', '""', 'llm'),
('setting-4', 'llm.model', '"gpt-4o"', 'llm'),
('setting-5', 'theme', '"system"', 'ui'),
('setting-6', 'fontSize', '"medium"', 'ui');
