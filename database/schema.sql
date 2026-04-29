CREATE DATABASE IF NOT EXISTS `kaoyan_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kaoyan_db`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) DEFAULT NULL COMMENT '微信openid',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `student_id` VARCHAR(50) DEFAULT NULL COMMENT '学号',
  `nickname` VARCHAR(100) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `college` VARCHAR(100) DEFAULT NULL COMMENT '学院',
  `major` VARCHAR(100) DEFAULT NULL COMMENT '专业',
  `target_school` VARCHAR(200) DEFAULT NULL COMMENT '目标院校',
  `target_major` VARCHAR(100) DEFAULT NULL COMMENT '目标专业',
  `exam_year` YEAR DEFAULT NULL COMMENT '考研年份',
  `role` ENUM('student','admin','super_admin') DEFAULT 'student' COMMENT '角色',
  `status` TINYINT DEFAULT 1 COMMENT '状态 1正常 0禁用',
  `is_banned` TINYINT DEFAULT 0 COMMENT '是否禁言',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 通知公告表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `content` TEXT COMMENT '内容',
  `type` ENUM('notice','announcement','urgent') DEFAULT 'notice' COMMENT '类型',
  `is_top` TINYINT DEFAULT 0 COMMENT '是否置顶',
  `is_strong_remind` TINYINT DEFAULT 0 COMMENT '是否强提醒',
  `publisher_id` INT DEFAULT NULL COMMENT '发布者ID',
  `status` TINYINT DEFAULT 1 COMMENT '1显示 0隐藏',
  `view_count` INT DEFAULT 0 COMMENT '浏览次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_is_top` (`is_top`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知公告表';

-- 通知已读记录表
CREATE TABLE IF NOT EXISTS `notification_reads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `notification_id` INT NOT NULL COMMENT '通知ID',
  `read_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_notice` (`user_id`, `notification_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知已读记录';

-- 广告表
CREATE TABLE IF NOT EXISTS `ads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) DEFAULT NULL COMMENT '标题',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片地址',
  `link_url` VARCHAR(500) DEFAULT NULL COMMENT '跳转链接',
  `link_type` ENUM('page','external') DEFAULT 'page' COMMENT '跳转类型',
  `position` ENUM('banner','fixed','notice') DEFAULT 'banner' COMMENT '位置',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '1启用 0停用',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `view_count` INT DEFAULT 0 COMMENT '曝光量',
  `click_count` INT DEFAULT 0 COMMENT '点击量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告表';

-- 考研时间线节点表
CREATE TABLE IF NOT EXISTS `timeline_nodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '节点名称',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
  `target_date` DATE DEFAULT NULL COMMENT '目标日期',
  `year` YEAR NOT NULL COMMENT '年份',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考研时间线节点表';

-- 用户时间线订阅表
CREATE TABLE IF NOT EXISTS `user_timeline_subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `node_id` INT NOT NULL,
  `remind_3days` TINYINT DEFAULT 1 COMMENT '提前3天提醒',
  `remind_1day` TINYINT DEFAULT 1 COMMENT '提前1天提醒',
  `remind_today` TINYINT DEFAULT 1 COMMENT '当天提醒',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_node` (`user_id`, `node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户时间线订阅';

-- 励志文案表
CREATE TABLE IF NOT EXISTS `inspirational_quotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `content` VARCHAR(500) NOT NULL COMMENT '文案内容',
  `author` VARCHAR(100) DEFAULT NULL COMMENT '作者',
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='励志文案表';

-- 学习计划表
CREATE TABLE IF NOT EXISTS `study_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `subject` VARCHAR(50) NOT NULL COMMENT '科目',
  `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
  `plan_duration` INT DEFAULT 60 COMMENT '计划时长(分钟)',
  `priority` ENUM('high','medium','low') DEFAULT 'medium' COMMENT '优先级',
  `status` ENUM('pending','completed','skipped') DEFAULT 'pending' COMMENT '状态',
  `plan_date` DATE NOT NULL COMMENT '计划日期',
  `template_type` ENUM('basic','strengthen','sprint','custom') DEFAULT 'custom' COMMENT '模板类型',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `plan_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习计划表';

-- 打卡记录表
CREATE TABLE IF NOT EXISTS `study_checkins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `plan_id` INT DEFAULT NULL COMMENT '关联计划ID',
  `subject` VARCHAR(50) NOT NULL COMMENT '科目',
  `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
  `duration` INT DEFAULT 0 COMMENT '实际时长(分钟)',
  `remark` TEXT COMMENT '备注',
  `checkin_date` DATE NOT NULL COMMENT '打卡日期',
  `checkin_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `checkin_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录表';

-- 资料分类表
CREATE TABLE IF NOT EXISTS `material_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `parent_id` INT DEFAULT 0 COMMENT '父级ID',
  `level` TINYINT DEFAULT 1 COMMENT '层级',
  `type` ENUM('public','major','notes','interview','exam') DEFAULT 'public' COMMENT '类型:公共课/专业课/笔记/复试/真题',
  `college` VARCHAR(100) DEFAULT NULL COMMENT '学院',
  `major` VARCHAR(100) DEFAULT NULL COMMENT '专业',
  `subject_code` VARCHAR(50) DEFAULT NULL COMMENT '科目代码',
  `subject_name` VARCHAR(100) DEFAULT NULL COMMENT '科目名称',
  `year` YEAR DEFAULT NULL COMMENT '年份',
  `sort_order` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资料分类表';

-- 资料表
CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL COMMENT '分类ID',
  `title` VARCHAR(200) NOT NULL COMMENT '资料标题',
  `description` TEXT COMMENT '描述',
  `file_name` VARCHAR(200) NOT NULL COMMENT '文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `file_type` VARCHAR(50) DEFAULT NULL COMMENT '文件类型',
  `uploader_id` INT NOT NULL COMMENT '上传者ID',
  `year` YEAR DEFAULT NULL COMMENT '资料年份',
  `download_count` INT DEFAULT 0 COMMENT '下载次数',
  `view_count` INT DEFAULT 0 COMMENT '预览次数',
  `avg_score` DECIMAL(2,1) DEFAULT 0 COMMENT '平均评分',
  `review_count` INT DEFAULT 0 COMMENT '评价数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `audit_status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `status` TINYINT DEFAULT 1 COMMENT '1上架 0下架',
  `is_watermarked` TINYINT DEFAULT 0 COMMENT '是否添加水印',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_uploader` (`uploader_id`),
  INDEX `idx_audit_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资料表';

-- 资料评价表
CREATE TABLE IF NOT EXISTS `material_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `material_id` INT NOT NULL COMMENT '资料ID',
  `user_id` INT NOT NULL COMMENT '评价用户ID',
  `parent_id` INT DEFAULT 0 COMMENT '父评论ID，0为顶级评论',
  `reply_to_user_id` INT DEFAULT 0 COMMENT '被回复的用户ID，0表示回复主评论',
  `score` TINYINT DEFAULT NULL COMMENT '评分1-5，仅顶级评论有评分',
  `comment` TEXT COMMENT '评论内容',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `reply_count` INT DEFAULT 0 COMMENT '回复数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_material` (`material_id`),
  INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资料评价表';

-- 评价点赞表
CREATE TABLE IF NOT EXISTS `review_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '点赞用户ID',
  `review_id` INT NOT NULL COMMENT '评价ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_review` (`user_id`, `review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价点赞表';

-- 资料点赞表
CREATE TABLE IF NOT EXISTS `material_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_material` (`user_id`, `material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资料点赞表';

-- 资料收藏表
CREATE TABLE IF NOT EXISTS `material_favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `folder_id` INT DEFAULT NULL COMMENT '文件夹ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_material` (`user_id`, `material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资料收藏表';

-- 文件夹表
CREATE TABLE IF NOT EXISTS `material_folders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT '文件夹名',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件夹表';

-- 下载日志表
CREATE TABLE IF NOT EXISTS `download_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_material` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='下载日志表';

-- 论坛帖子表
CREATE TABLE IF NOT EXISTS `forum_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '发帖人ID',
  `category` ENUM('study','experience','help','adjust','anonymous') NOT NULL COMMENT '板块',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `images` JSON DEFAULT NULL COMMENT '图片列表',
  `tags` JSON DEFAULT NULL COMMENT '标签',
  `view_count` INT DEFAULT 0 COMMENT '浏览数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT DEFAULT 0 COMMENT '评论数',
  `is_top` TINYINT DEFAULT 0 COMMENT '是否置顶',
  `is_essence` TINYINT DEFAULT 0 COMMENT '是否精华',
  `is_anonymous` TINYINT DEFAULT 0 COMMENT '是否匿名',
  `audit_status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛帖子表';

-- 论坛评论表
CREATE TABLE IF NOT EXISTS `forum_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL COMMENT '帖子ID',
  `user_id` INT NOT NULL COMMENT '评论人ID',
  `parent_id` INT DEFAULT 0 COMMENT '父评论ID',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `like_count` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_post` (`post_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='论坛评论表';

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS `forum_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `target_id` INT NOT NULL COMMENT '帖子或评论ID',
  `target_type` ENUM('post','comment') DEFAULT 'post' COMMENT '类型',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_target` (`user_id`, `target_id`, `target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子点赞表';

-- 帖子收藏表
CREATE TABLE IF NOT EXISTS `forum_favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_post` (`user_id`, `post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子收藏表';

-- 举报表
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reporter_id` INT NOT NULL COMMENT '举报人ID',
  `target_type` ENUM('post','comment','material','ad','review') NOT NULL COMMENT '举报对象类型',
  `target_id` INT NOT NULL COMMENT '举报对象ID',
  `reason` VARCHAR(200) NOT NULL COMMENT '举报原因',
  `description` TEXT COMMENT '详细描述',
  `status` ENUM('pending','processed','rejected') DEFAULT 'pending' COMMENT '处理状态',
  `handler_id` INT DEFAULT NULL COMMENT '处理人ID',
  `handle_result` TEXT COMMENT '处理结果',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `handled_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- 考研数据表（本校特色）
CREATE TABLE IF NOT EXISTS `kaoyan_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` YEAR NOT NULL COMMENT '年份',
  `college` VARCHAR(100) DEFAULT NULL COMMENT '学院',
  `major` VARCHAR(100) DEFAULT NULL COMMENT '专业',
  `total_applicants` INT DEFAULT 0 COMMENT '报名人数',
  `admitted_count` INT DEFAULT 0 COMMENT '上岸人数',
  `cross_major_count` INT DEFAULT 0 COMMENT '跨考人数',
  `cross_target_major` VARCHAR(100) DEFAULT NULL COMMENT '跨考目标专业',
  `target_school` VARCHAR(200) DEFAULT NULL COMMENT '目标院校',
  `safe_score` DECIMAL(5,2) DEFAULT NULL COMMENT '安全分',
  `median_score` DECIMAL(5,2) DEFAULT NULL COMMENT '中位分',
  `sprint_score` DECIMAL(5,2) DEFAULT NULL COMMENT '冲刺分',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_year_college` (`year`, `college`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考研数据表';



-- AI使用记录表
CREATE TABLE IF NOT EXISTS `ai_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('polish','oral') NOT NULL COMMENT '润色/口语',
  `input_content` TEXT NOT NULL COMMENT '输入内容',
  `output_content` TEXT COMMENT '输出内容',
  `score` INT DEFAULT NULL COMMENT '评分',
  `status` ENUM('success','failed','pending') DEFAULT 'pending',
  `error_msg` TEXT COMMENT '错误信息',
  `expires_at` DATETIME DEFAULT NULL COMMENT '过期时间(7天后删除)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI使用记录表';

-- 复试口语题库表
CREATE TABLE IF NOT EXISTS `oral_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_en` VARCHAR(500) NOT NULL COMMENT '英文问题',
  `question_cn` VARCHAR(500) DEFAULT NULL COMMENT '中文翻译',
  `reference_answer` TEXT COMMENT '参考回答',
  `category` VARCHAR(100) DEFAULT NULL COMMENT '分类',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='复试口语题库表';

-- 敏感词表
CREATE TABLE IF NOT EXISTS `sensitive_words` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `word` VARCHAR(100) NOT NULL COMMENT '敏感词',
  `category` VARCHAR(50) DEFAULT 'other' COMMENT '分类',
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='敏感词表';

-- 大屏表
CREATE TABLE IF NOT EXISTS `screens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) DEFAULT NULL COMMENT '大屏名称',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片地址',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '1启用 0停用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='大屏表';

CREATE TABLE IF NOT EXISTS `national_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` YEAR NOT NULL COMMENT '年份',
  `region` ENUM('A', 'B') NOT NULL COMMENT 'A区/B区',
  `category` ENUM('academic', 'professional') NOT NULL COMMENT '学术型/专业型',
  `subject_type` VARCHAR(50) NOT NULL COMMENT '学科门类',
  `total_score` INT NOT NULL COMMENT '总分线',
  `politics_score` INT DEFAULT NULL COMMENT '政治线',
  `foreign_score` INT DEFAULT NULL COMMENT '外语线',
  `subject1_score` INT DEFAULT NULL COMMENT '业务课一线',
  `subject2_score` INT DEFAULT NULL COMMENT '业务课二线',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_year` (`year`),
  INDEX `idx_region_category` (`region`, `category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国家线数据表';

-- 运营配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL COMMENT '发送者ID',
  `receiver_id` INT NOT NULL COMMENT '接收者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读 0未读 1已读',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sender` (`sender_id`),
  INDEX `idx_receiver` (`receiver_id`),
  INDEX `idx_sender_receiver` (`sender_id`, `receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 插入初始数据
INSERT INTO `timeline_nodes` (`name`, `description`, `target_date`, `year`, `sort_order`) VALUES
('预报名', '硕士研究生招生网上预报名', '2026-09-24', 2026, 1),
('正式报名', '硕士研究生招生正式报名', '2026-10-05', 2026, 2),
('现场/网上确认', '报名信息现场确认或网上确认', '2026-11-01', 2026, 3),
('准考证打印', '下载打印准考证', '2026-12-15', 2026, 4),
('初试', '全国硕士研究生招生考试初试', '2026-12-25', 2026, 5),
('成绩查询', '初试成绩查询', '2027-02-15', 2027, 6),
('国家线公布', '国家分数线公布', '2027-03-10', 2027, 7),
('院校线公布', '各院校分数线公布', '2027-03-15', 2027, 8),
('调剂开放', '调剂系统开放', '2027-03-28', 2027, 9),
('复试', '复试阶段', '2027-04-01', 2027, 10),
('待录取', '待录取通知', '2027-04-20', 2027, 11);

INSERT INTO `inspirational_quotes` (`content`, `author`) VALUES
('星光不问赶路人，时光不负有心人。', '未知'),
('既然选择了远方，便只顾风雨兼程。', '汪国真'),
('你努力的样子，真的很美。', '未知'),
('乾坤未定，你我皆是黑马。', '未知'),
('种一棵树最好的时间是十年前，其次是现在。', '未知');

INSERT INTO `system_configs` (`config_key`, `config_value`, `description`) VALUES
('ai_daily_limit_polish', '3', 'AI润色每日免费次数'),
('site_name', '校内考研助手', '站点名称');

INSERT INTO `sensitive_words` (`word`, `category`) VALUES
('加微信', '引流'),
('代写', '违规'),
('作弊', '违规'),
('卖答案', '诈骗'),
('QQ群', '引流');

CREATE TABLE IF NOT EXISTS `oral_questions_user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '上传用户ID',
  `question_en` VARCHAR(500) NOT NULL COMMENT '英文问题',
  `question_cn` VARCHAR(500) DEFAULT NULL COMMENT '中文翻译',
  `reference_answer` TEXT COMMENT '参考回答',
  `category` VARCHAR(100) DEFAULT NULL COMMENT '分类',
  `audit_status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_audit_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传口语题库表';

CREATE TABLE IF NOT EXISTS `resume_templates_user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '上传用户ID',
  `name` VARCHAR(200) NOT NULL COMMENT '模板名称',
  `desc` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
  `file_name` VARCHAR(200) NOT NULL COMMENT '文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `download_count` INT DEFAULT 0 COMMENT '下载次数',
  `audit_status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_audit_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传简历模板表';

CREATE TABLE IF NOT EXISTS `email_templates_user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '上传用户ID',
  `name` VARCHAR(200) NOT NULL COMMENT '模板名称',
  `desc` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
  `file_name` VARCHAR(200) NOT NULL COMMENT '文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `download_count` INT DEFAULT 0 COMMENT '下载次数',
  `audit_status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_audit_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传邮件模板表';

CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '反馈用户ID',
  `content` TEXT NOT NULL COMMENT '反馈内容',
  `status` ENUM('pending','processed') DEFAULT 'pending' COMMENT '处理状态',
  `handler_id` INT DEFAULT NULL COMMENT '处理人ID',
  `handle_result` TEXT COMMENT '处理结果',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `handled_at` DATETIME DEFAULT NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='意见反馈表';
