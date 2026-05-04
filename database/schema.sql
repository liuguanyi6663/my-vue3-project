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
  `is_landed` TINYINT DEFAULT 0 COMMENT '是否已上岸认证 1是 0否',
  `is_deleting` TINYINT DEFAULT 0 COMMENT '是否在注销冷静期 1是 0否',
  `delete_request_at` DATETIME DEFAULT NULL COMMENT '注销请求时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_is_deleting` (`is_deleting`)
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
  `target_type` ENUM('post','comment','material','ad','review','message') NOT NULL COMMENT '举报对象类型',
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

INSERT INTO `national_lines` (`year`, `region`, `category`, `subject_type`, `total_score`, `politics_score`, `foreign_score`, `subject1_score`, `subject2_score`) VALUES
(2025, 'A', 'academic', '哲学', 321, 39, 39, 59, 59),
(2025, 'A', 'academic', '经济学', 323, 40, 40, 60, 60),
(2025, 'A', 'academic', '法学', 323, 40, 40, 60, 60),
(2025, 'A', 'academic', '教育学', 341, 45, 45, 135, 0),
(2025, 'A', 'academic', '文学', 351, 47, 47, 71, 71),
(2025, 'A', 'academic', '历史学', 336, 43, 43, 129, 0),
(2025, 'A', 'academic', '理学', 274, 34, 34, 51, 51),
(2025, 'A', 'academic', '工学', 260, 34, 34, 51, 51),
(2025, 'A', 'academic', '农学', 245, 33, 33, 50, 50),
(2025, 'A', 'academic', '医学', 293, 36, 36, 108, 0),
(2025, 'A', 'academic', '军事学', 260, 34, 34, 51, 51),
(2025, 'A', 'academic', '管理学', 333, 41, 41, 62, 62),
(2025, 'A', 'academic', '艺术学', 351, 37, 37, 56, 56),
(2025, 'A', 'academic', '交叉学科', 266, 34, 34, 51, 51),
(2025, 'A', 'academic', '体育学', 304, 36, 36, 108, 0),
(2025, 'A', 'academic', '工学照顾专业', 251, 33, 33, 50, 50),
(2025, 'A', 'academic', '中医类照顾专业', 293, 36, 36, 108, 0),
(2025, 'B', 'academic', '哲学', 311, 36, 36, 54, 54),
(2025, 'B', 'academic', '经济学', 313, 37, 37, 56, 56),
(2025, 'B', 'academic', '法学', 313, 37, 37, 56, 56),
(2025, 'B', 'academic', '教育学', 331, 42, 42, 126, 0),
(2025, 'B', 'academic', '文学', 341, 44, 44, 66, 66),
(2025, 'B', 'academic', '历史学', 326, 40, 40, 120, 0),
(2025, 'B', 'academic', '理学', 264, 31, 31, 47, 47),
(2025, 'B', 'academic', '工学', 250, 31, 31, 47, 47),
(2025, 'B', 'academic', '农学', 235, 30, 30, 45, 45),
(2025, 'B', 'academic', '医学', 283, 33, 33, 99, 0),
(2025, 'B', 'academic', '军事学', 250, 31, 31, 47, 47),
(2025, 'B', 'academic', '管理学', 323, 38, 38, 57, 57),
(2025, 'B', 'academic', '艺术学', 341, 34, 34, 51, 51),
(2025, 'B', 'academic', '交叉学科', 256, 31, 31, 47, 47),
(2025, 'B', 'academic', '体育学', 294, 33, 33, 99, 0),
(2025, 'B', 'academic', '工学照顾专业', 241, 30, 30, 45, 45),
(2025, 'B', 'academic', '中医类照顾专业', 283, 33, 33, 99, 0),
(2025, 'A', 'professional', '金融', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '应用统计', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '税务', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '国际商务', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '保险', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '资产评估', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '审计', 194, 48, 48, 96, 0),
(2025, 'A', 'professional', '法律', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '社会工作', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '警务', 323, 40, 40, 60, 60),
(2025, 'A', 'professional', '教育', 341, 45, 45, 68, 68),
(2025, 'A', 'professional', '体育', 304, 36, 36, 108, 0),
(2025, 'A', 'professional', '国际中文教育', 341, 45, 45, 68, 68),
(2025, 'A', 'professional', '应用心理', 341, 45, 45, 135, 0),
(2025, 'A', 'professional', '翻译', 351, 47, 47, 71, 71),
(2025, 'A', 'professional', '新闻与传播', 351, 47, 47, 71, 71),
(2025, 'A', 'professional', '出版', 351, 47, 47, 71, 71),
(2025, 'A', 'professional', '文物与博物馆', 336, 43, 43, 129, 0),
(2025, 'A', 'professional', '建筑学', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '城市规划', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '电子信息', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '机械', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '材料与化工', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '资源与环境', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '能源动力', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '土木水利', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '生物与医药', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '交通运输', 260, 34, 34, 51, 51),
(2025, 'A', 'professional', '农业', 245, 33, 33, 50, 50),
(2025, 'A', 'professional', '兽医', 245, 33, 33, 50, 50),
(2025, 'A', 'professional', '风景园林', 245, 33, 33, 50, 50),
(2025, 'A', 'professional', '林业', 245, 33, 33, 50, 50),
(2025, 'A', 'professional', '临床医学', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '口腔医学', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '公共卫生', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '护理', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '药学', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '中药学', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '中医', 293, 36, 36, 108, 0),
(2025, 'A', 'professional', '工商管理', 151, 35, 35, 70, 0),
(2025, 'A', 'professional', '旅游管理', 151, 35, 35, 70, 0),
(2025, 'A', 'professional', '公共管理', 164, 38, 38, 76, 0),
(2025, 'A', 'professional', '会计', 194, 48, 48, 96, 0),
(2025, 'A', 'professional', '图书情报', 191, 48, 48, 96, 0),
(2025, 'A', 'professional', '工程管理', 162, 38, 38, 76, 0),
(2025, 'A', 'professional', '艺术', 351, 37, 37, 56, 56),
(2025, 'B', 'professional', '金融', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '应用统计', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '税务', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '国际商务', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '保险', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '资产评估', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '审计', 184, 43, 43, 86, 0),
(2025, 'B', 'professional', '法律', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '社会工作', 313, 37, 37, 56, 56),
(2025, 'B', 'professional', '教育', 331, 42, 42, 63, 63),
(2025, 'B', 'professional', '体育', 294, 33, 33, 99, 0),
(2025, 'B', 'professional', '国际中文教育', 331, 42, 42, 63, 63),
(2025, 'B', 'professional', '应用心理', 331, 42, 42, 126, 0),
(2025, 'B', 'professional', '翻译', 341, 44, 44, 66, 66),
(2025, 'B', 'professional', '新闻与传播', 341, 44, 44, 66, 66),
(2025, 'B', 'professional', '出版', 341, 44, 44, 66, 66),
(2025, 'B', 'professional', '文物与博物馆', 326, 40, 40, 120, 0),
(2025, 'B', 'professional', '电子信息', 250, 31, 31, 47, 47),
(2025, 'B', 'professional', '机械', 250, 31, 31, 47, 47),
(2025, 'B', 'professional', '临床医学', 283, 33, 33, 99, 0),
(2025, 'B', 'professional', '工商管理', 141, 30, 30, 60, 0),
(2025, 'B', 'professional', '旅游管理', 141, 30, 30, 60, 0),
(2025, 'B', 'professional', '公共管理', 154, 33, 33, 66, 0),
(2025, 'B', 'professional', '会计', 184, 43, 43, 86, 0),
(2025, 'B', 'professional', '图书情报', 181, 43, 43, 86, 0),
(2025, 'B', 'professional', '工程管理', 152, 33, 33, 66, 0),
(2025, 'B', 'professional', '艺术', 341, 34, 34, 51, 51),
(2024, 'A', 'academic', '哲学', 333, 47, 47, 71, 71),
(2024, 'A', 'academic', '经济学', 338, 47, 47, 71, 71),
(2024, 'A', 'academic', '法学', 331, 47, 47, 71, 71),
(2024, 'A', 'academic', '教育学', 350, 51, 51, 153, 0),
(2024, 'A', 'academic', '文学', 365, 55, 55, 83, 83),
(2024, 'A', 'academic', '历史学', 345, 49, 49, 147, 0),
(2024, 'A', 'academic', '理学', 288, 41, 41, 62, 62),
(2024, 'A', 'academic', '工学', 273, 37, 37, 56, 56),
(2024, 'A', 'academic', '农学', 251, 33, 33, 50, 50),
(2024, 'A', 'academic', '医学', 304, 42, 42, 126, 0),
(2024, 'A', 'academic', '军事学', 260, 35, 35, 53, 53),
(2024, 'A', 'academic', '管理学', 347, 49, 49, 74, 74),
(2024, 'A', 'academic', '艺术学', 362, 40, 40, 60, 60),
(2024, 'A', 'academic', '交叉学科', 275, 39, 39, 59, 59),
(2024, 'A', 'academic', '体育学', 313, 41, 41, 123, 0),
(2024, 'A', 'academic', '工学照顾专业', 260, 35, 35, 53, 53),
(2024, 'A', 'academic', '中医类照顾专业', 303, 42, 42, 126, 0),
(2024, 'B', 'academic', '哲学', 323, 44, 44, 66, 66),
(2024, 'B', 'academic', '经济学', 328, 44, 44, 66, 66),
(2024, 'B', 'academic', '法学', 321, 44, 44, 66, 66),
(2024, 'B', 'academic', '教育学', 340, 48, 48, 144, 0),
(2024, 'B', 'academic', '文学', 355, 52, 52, 78, 78),
(2024, 'B', 'academic', '历史学', 335, 46, 46, 138, 0),
(2024, 'B', 'academic', '理学', 278, 38, 38, 57, 57),
(2024, 'B', 'academic', '工学', 263, 34, 34, 51, 51),
(2024, 'B', 'academic', '农学', 241, 30, 30, 45, 45),
(2024, 'B', 'academic', '医学', 294, 39, 39, 117, 0),
(2024, 'B', 'academic', '军事学', 250, 32, 32, 48, 48),
(2024, 'B', 'academic', '管理学', 337, 46, 46, 69, 69),
(2024, 'B', 'academic', '艺术学', 352, 37, 37, 56, 56),
(2024, 'B', 'academic', '交叉学科', 265, 36, 36, 54, 54),
(2024, 'B', 'academic', '体育学', 303, 38, 38, 114, 0),
(2024, 'B', 'academic', '工学照顾专业', 250, 32, 32, 48, 48),
(2024, 'B', 'academic', '中医类照顾专业', 293, 39, 39, 117, 0),
(2024, 'A', 'professional', '金融', 338, 47, 47, 71, 71),
(2024, 'A', 'professional', '应用统计', 338, 47, 47, 71, 71),
(2024, 'A', 'professional', '税务', 338, 47, 47, 71, 71),
(2024, 'A', 'professional', '国际商务', 338, 47, 47, 71, 71),
(2024, 'A', 'professional', '保险', 338, 47, 47, 71, 71),
(2024, 'A', 'professional', '资产评估', 338, 47, 47, 71, 71),
(2024, 'A', 'professional', '审计', 201, 52, 52, 104, 0),
(2024, 'A', 'professional', '法律', 331, 47, 47, 71, 71),
(2024, 'A', 'professional', '社会工作', 331, 47, 47, 71, 71),
(2024, 'A', 'professional', '教育', 350, 51, 51, 77, 77),
(2024, 'A', 'professional', '国际中文教育', 350, 51, 51, 77, 77),
(2024, 'A', 'professional', '体育', 313, 41, 41, 123, 0),
(2024, 'A', 'professional', '应用心理', 350, 51, 51, 153, 0),
(2024, 'A', 'professional', '翻译', 365, 55, 55, 83, 83),
(2024, 'A', 'professional', '新闻与传播', 365, 55, 55, 83, 83),
(2024, 'A', 'professional', '出版', 365, 55, 55, 83, 83),
(2024, 'A', 'professional', '文物与博物馆', 345, 49, 49, 147, 0),
(2024, 'A', 'professional', '建筑学', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '电子信息', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '机械', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '材料与化工', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '资源与环境', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '能源动力', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '土木水利', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '生物与医药', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '交通运输', 273, 37, 37, 56, 56),
(2024, 'A', 'professional', '农业', 251, 33, 33, 50, 50),
(2024, 'A', 'professional', '兽医', 251, 33, 33, 50, 50),
(2024, 'A', 'professional', '风景园林', 251, 33, 33, 50, 50),
(2024, 'A', 'professional', '林业', 251, 33, 33, 50, 50),
(2024, 'A', 'professional', '临床医学', 304, 42, 42, 126, 0),
(2024, 'A', 'professional', '口腔医学', 304, 42, 42, 126, 0),
(2024, 'A', 'professional', '公共卫生', 304, 42, 42, 126, 0),
(2024, 'A', 'professional', '护理', 304, 42, 42, 126, 0),
(2024, 'A', 'professional', '药学', 304, 42, 42, 126, 0),
(2024, 'A', 'professional', '中药学', 304, 42, 42, 126, 0),
(2024, 'A', 'professional', '中医', 303, 42, 42, 126, 0),
(2024, 'A', 'professional', '工商管理', 162, 39, 39, 78, 0),
(2024, 'A', 'professional', '旅游管理', 162, 39, 39, 78, 0),
(2024, 'A', 'professional', '公共管理', 173, 43, 43, 86, 0),
(2024, 'A', 'professional', '会计', 201, 52, 52, 104, 0),
(2024, 'A', 'professional', '图书情报', 198, 51, 51, 102, 0),
(2024, 'A', 'professional', '工程管理', 176, 43, 43, 86, 0),
(2024, 'A', 'professional', '艺术', 362, 40, 40, 60, 60),
(2024, 'B', 'professional', '金融', 328, 44, 44, 66, 66),
(2024, 'B', 'professional', '法律', 321, 44, 44, 66, 66),
(2024, 'B', 'professional', '教育', 340, 48, 48, 72, 72),
(2024, 'B', 'professional', '体育', 303, 38, 38, 114, 0),
(2024, 'B', 'professional', '翻译', 355, 52, 52, 78, 78),
(2024, 'B', 'professional', '电子信息', 263, 34, 34, 51, 51),
(2024, 'B', 'professional', '临床医学', 294, 39, 39, 117, 0),
(2024, 'B', 'professional', '中医', 293, 39, 39, 117, 0),
(2024, 'B', 'professional', '工商管理', 152, 34, 34, 68, 0),
(2024, 'B', 'professional', '公共管理', 163, 38, 38, 76, 0),
(2024, 'B', 'professional', '会计', 191, 47, 47, 94, 0),
(2024, 'B', 'professional', '图书情报', 188, 46, 46, 92, 0),
(2024, 'B', 'professional', '工程管理', 166, 38, 38, 76, 0),
(2024, 'B', 'professional', '艺术', 352, 37, 37, 56, 56),
(2023, 'A', 'academic', '哲学', 323, 45, 45, 68, 68),
(2023, 'A', 'academic', '经济学', 346, 48, 48, 72, 72),
(2023, 'A', 'academic', '法学', 326, 45, 45, 68, 68),
(2023, 'A', 'academic', '教育学', 350, 51, 51, 153, 0),
(2023, 'A', 'academic', '文学', 363, 54, 54, 81, 81),
(2023, 'A', 'academic', '历史学', 336, 46, 46, 138, 0),
(2023, 'A', 'academic', '理学', 279, 38, 38, 57, 57),
(2023, 'A', 'academic', '工学', 273, 38, 38, 57, 57),
(2023, 'A', 'academic', '农学', 251, 33, 33, 50, 50),
(2023, 'A', 'academic', '医学', 296, 39, 39, 117, 0),
(2023, 'A', 'academic', '军事学', 260, 35, 35, 53, 53),
(2023, 'A', 'academic', '管理学', 340, 47, 47, 71, 71),
(2023, 'A', 'academic', '艺术学', 362, 40, 40, 60, 60),
(2023, 'A', 'academic', '交叉学科', 265, 36, 36, 54, 54),
(2023, 'A', 'academic', '体育学', 305, 39, 39, 117, 0),
(2023, 'A', 'academic', '工学照顾专业', 260, 35, 35, 53, 53),
(2023, 'A', 'academic', '中医类照顾专业', 295, 39, 39, 117, 0),
(2023, 'B', 'academic', '哲学', 313, 42, 42, 63, 63),
(2023, 'B', 'academic', '经济学', 336, 45, 45, 68, 68),
(2023, 'B', 'academic', '法学', 316, 42, 42, 63, 63),
(2023, 'B', 'academic', '教育学', 340, 48, 48, 144, 0),
(2023, 'B', 'academic', '文学', 353, 51, 51, 77, 77),
(2023, 'B', 'academic', '历史学', 326, 43, 43, 129, 0),
(2023, 'B', 'academic', '理学', 269, 35, 35, 53, 53),
(2023, 'B', 'academic', '工学', 263, 35, 35, 53, 53),
(2023, 'B', 'academic', '农学', 241, 30, 30, 45, 45),
(2023, 'B', 'academic', '医学', 286, 36, 36, 108, 0),
(2023, 'B', 'academic', '军事学', 250, 32, 32, 48, 48),
(2023, 'B', 'academic', '管理学', 330, 44, 44, 66, 66),
(2023, 'B', 'academic', '艺术学', 352, 37, 37, 56, 56),
(2023, 'B', 'academic', '交叉学科', 255, 33, 33, 50, 50),
(2023, 'B', 'academic', '体育学', 295, 36, 36, 108, 0),
(2023, 'B', 'academic', '工学照顾专业', 250, 32, 32, 48, 48),
(2023, 'B', 'academic', '中医类照顾专业', 285, 36, 36, 108, 0),
(2023, 'A', 'professional', '金融', 346, 48, 48, 72, 72),
(2023, 'A', 'professional', '应用统计', 346, 48, 48, 72, 72),
(2023, 'A', 'professional', '税务', 346, 48, 48, 72, 72),
(2023, 'A', 'professional', '国际商务', 346, 48, 48, 72, 72),
(2023, 'A', 'professional', '保险', 346, 48, 48, 72, 72),
(2023, 'A', 'professional', '资产评估', 346, 48, 48, 72, 72),
(2023, 'A', 'professional', '审计', 197, 50, 50, 100, 0),
(2023, 'A', 'professional', '法律', 326, 45, 45, 68, 68),
(2023, 'A', 'professional', '社会工作', 326, 45, 45, 68, 68),
(2023, 'A', 'professional', '教育', 350, 51, 51, 77, 77),
(2023, 'A', 'professional', '国际中文教育', 350, 51, 51, 77, 77),
(2023, 'A', 'professional', '体育', 305, 39, 39, 117, 0),
(2023, 'A', 'professional', '应用心理', 350, 51, 51, 153, 0),
(2023, 'A', 'professional', '翻译', 363, 54, 54, 81, 81),
(2023, 'A', 'professional', '新闻与传播', 363, 54, 54, 81, 81),
(2023, 'A', 'professional', '出版', 363, 54, 54, 81, 81),
(2023, 'A', 'professional', '文物与博物馆', 336, 46, 46, 138, 0),
(2023, 'A', 'professional', '建筑学', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '电子信息', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '机械', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '材料与化工', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '资源与环境', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '能源动力', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '土木水利', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '生物与医药', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '交通运输', 273, 38, 38, 57, 57),
(2023, 'A', 'professional', '农业', 251, 33, 33, 50, 50),
(2023, 'A', 'professional', '兽医', 251, 33, 33, 50, 50),
(2023, 'A', 'professional', '风景园林', 251, 33, 33, 50, 50),
(2023, 'A', 'professional', '林业', 251, 33, 33, 50, 50),
(2023, 'A', 'professional', '临床医学', 296, 39, 39, 117, 0),
(2023, 'A', 'professional', '口腔医学', 296, 39, 39, 117, 0),
(2023, 'A', 'professional', '公共卫生', 296, 39, 39, 117, 0),
(2023, 'A', 'professional', '护理', 296, 39, 39, 117, 0),
(2023, 'A', 'professional', '药学', 296, 39, 39, 117, 0),
(2023, 'A', 'professional', '中药学', 296, 39, 39, 117, 0),
(2023, 'A', 'professional', '中医', 295, 39, 39, 117, 0),
(2023, 'A', 'professional', '工商管理', 167, 41, 41, 82, 0),
(2023, 'A', 'professional', '旅游管理', 167, 41, 41, 82, 0),
(2023, 'A', 'professional', '公共管理', 175, 44, 44, 88, 0),
(2023, 'A', 'professional', '会计', 197, 50, 50, 100, 0),
(2023, 'A', 'professional', '图书情报', 198, 52, 52, 104, 0),
(2023, 'A', 'professional', '工程管理', 178, 44, 44, 88, 0),
(2023, 'A', 'professional', '艺术', 362, 40, 40, 60, 60),
(2023, 'B', 'professional', '金融', 336, 45, 45, 68, 68),
(2023, 'B', 'professional', '法律', 316, 42, 42, 63, 63),
(2023, 'B', 'professional', '教育', 340, 48, 48, 72, 72),
(2023, 'B', 'professional', '体育', 295, 36, 36, 108, 0),
(2023, 'B', 'professional', '翻译', 353, 51, 51, 77, 77),
(2023, 'B', 'professional', '电子信息', 263, 35, 35, 53, 53),
(2023, 'B', 'professional', '临床医学', 286, 36, 36, 108, 0),
(2023, 'B', 'professional', '中医', 285, 36, 36, 108, 0),
(2023, 'B', 'professional', '工商管理', 157, 36, 36, 72, 0),
(2023, 'B', 'professional', '公共管理', 165, 39, 39, 78, 0),
(2023, 'B', 'professional', '会计', 187, 45, 45, 90, 0),
(2023, 'B', 'professional', '图书情报', 188, 47, 47, 94, 0),
(2023, 'B', 'professional', '工程管理', 168, 39, 39, 78, 0),
(2023, 'B', 'professional', '艺术', 352, 37, 37, 56, 56),
(2022, 'A', 'academic', '哲学', 314, 45, 45, 68, 68),
(2022, 'A', 'academic', '经济学', 360, 52, 52, 78, 78),
(2022, 'A', 'academic', '法学', 335, 46, 46, 69, 69),
(2022, 'A', 'academic', '教育学', 351, 51, 51, 153, 0),
(2022, 'A', 'academic', '文学', 367, 56, 56, 84, 84),
(2022, 'A', 'academic', '历史学', 336, 46, 46, 138, 0),
(2022, 'A', 'academic', '理学', 290, 39, 39, 59, 59),
(2022, 'A', 'academic', '工学', 273, 38, 38, 57, 57),
(2022, 'A', 'academic', '农学', 252, 33, 33, 50, 50),
(2022, 'A', 'academic', '医学', 309, 43, 43, 129, 0),
(2022, 'A', 'academic', '军事学', 265, 37, 37, 56, 56),
(2022, 'A', 'academic', '管理学', 353, 51, 51, 77, 77),
(2022, 'A', 'academic', '艺术学', 361, 40, 40, 60, 60),
(2022, 'A', 'academic', '体育学', 296, 37, 37, 111, 0),
(2022, 'A', 'academic', '工学照顾专业', 260, 35, 35, 53, 53),
(2022, 'A', 'academic', '中医类照顾专业', 306, 41, 41, 123, 0),
(2022, 'B', 'academic', '哲学', 304, 42, 42, 63, 63),
(2022, 'B', 'academic', '经济学', 350, 49, 49, 74, 74),
(2022, 'B', 'academic', '法学', 325, 43, 43, 65, 65),
(2022, 'B', 'academic', '教育学', 341, 48, 48, 144, 0),
(2022, 'B', 'academic', '文学', 357, 53, 53, 80, 80),
(2022, 'B', 'academic', '历史学', 326, 43, 43, 129, 0),
(2022, 'B', 'academic', '理学', 280, 36, 36, 54, 54),
(2022, 'B', 'academic', '工学', 263, 35, 35, 53, 53),
(2022, 'B', 'academic', '农学', 242, 30, 30, 45, 45),
(2022, 'B', 'academic', '医学', 299, 40, 40, 120, 0),
(2022, 'B', 'academic', '军事学', 255, 34, 34, 51, 51),
(2022, 'B', 'academic', '管理学', 343, 48, 48, 72, 72),
(2022, 'B', 'academic', '艺术学', 351, 37, 37, 56, 56),
(2022, 'B', 'academic', '体育学', 286, 34, 34, 102, 102),
(2022, 'B', 'academic', '工学照顾专业', 250, 32, 32, 48, 48),
(2022, 'B', 'academic', '中医类照顾专业', 296, 38, 38, 114, 114),
(2022, 'A', 'professional', '金融', 360, 52, 52, 78, 78),
(2022, 'A', 'professional', '应用统计', 360, 52, 52, 78, 78),
(2022, 'A', 'professional', '税务', 360, 52, 52, 78, 78),
(2022, 'A', 'professional', '国际商务', 360, 52, 52, 78, 78),
(2022, 'A', 'professional', '保险', 360, 52, 52, 78, 78),
(2022, 'A', 'professional', '资产评估', 360, 52, 52, 78, 78),
(2022, 'A', 'professional', '审计', 194, 50, 50, 100, 0),
(2022, 'A', 'professional', '法律', 335, 46, 46, 69, 69),
(2022, 'A', 'professional', '社会工作', 335, 46, 46, 69, 69),
(2022, 'A', 'professional', '教育', 351, 51, 51, 77, 77),
(2022, 'A', 'professional', '汉语国际教育', 351, 51, 51, 77, 77),
(2022, 'A', 'professional', '体育', 296, 37, 37, 111, 0),
(2022, 'A', 'professional', '应用心理', 351, 51, 51, 153, 0),
(2022, 'A', 'professional', '翻译', 367, 56, 56, 84, 84),
(2022, 'A', 'professional', '新闻与传播', 367, 56, 56, 84, 84),
(2022, 'A', 'professional', '出版', 367, 56, 56, 84, 84),
(2022, 'A', 'professional', '文物与博物馆', 336, 46, 46, 138, 0),
(2022, 'A', 'professional', '建筑学', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '电子信息', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '机械', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '材料与化工', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '资源与环境', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '能源动力', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '土木水利', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '生物与医药', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '交通运输', 273, 38, 38, 57, 57),
(2022, 'A', 'professional', '农业', 252, 33, 33, 50, 50),
(2022, 'A', 'professional', '兽医', 252, 33, 33, 50, 50),
(2022, 'A', 'professional', '风景园林', 252, 33, 33, 50, 50),
(2022, 'A', 'professional', '林业', 252, 33, 33, 50, 50),
(2022, 'A', 'professional', '临床医学', 309, 43, 43, 129, 0),
(2022, 'A', 'professional', '口腔医学', 309, 43, 43, 129, 0),
(2022, 'A', 'professional', '公共卫生', 309, 43, 43, 129, 0),
(2022, 'A', 'professional', '护理', 309, 43, 43, 129, 0),
(2022, 'A', 'professional', '药学', 309, 43, 43, 129, 0),
(2022, 'A', 'professional', '中药学', 309, 43, 43, 129, 0),
(2022, 'A', 'professional', '中医', 306, 41, 41, 123, 0),
(2022, 'A', 'professional', '军事', 265, 37, 37, 56, 56),
(2022, 'A', 'professional', '工商管理', 170, 42, 42, 84, 0),
(2022, 'A', 'professional', '旅游管理', 170, 42, 42, 84, 0),
(2022, 'A', 'professional', '公共管理', 178, 45, 45, 90, 0),
(2022, 'A', 'professional', '会计', 193, 50, 50, 100, 0),
(2022, 'A', 'professional', '图书情报', 194, 50, 50, 100, 0),
(2022, 'A', 'professional', '工程管理', 189, 47, 47, 94, 0),
(2022, 'A', 'professional', '艺术', 361, 40, 40, 60, 60),
(2022, 'B', 'professional', '金融', 350, 49, 49, 74, 74),
(2022, 'B', 'professional', '法律', 325, 43, 43, 65, 65),
(2022, 'B', 'professional', '教育', 341, 48, 48, 72, 72),
(2022, 'B', 'professional', '体育', 286, 34, 34, 102, 0),
(2022, 'B', 'professional', '翻译', 357, 53, 53, 80, 80),
(2022, 'B', 'professional', '电子信息', 263, 35, 35, 53, 53),
(2022, 'B', 'professional', '临床医学', 299, 40, 40, 120, 0),
(2022, 'B', 'professional', '中医', 296, 38, 38, 114, 0),
(2022, 'B', 'professional', '工商管理', 160, 37, 37, 74, 0),
(2022, 'B', 'professional', '公共管理', 168, 40, 40, 80, 0),
(2022, 'B', 'professional', '会计', 183, 45, 45, 90, 0),
(2022, 'B', 'professional', '图书情报', 184, 45, 45, 90, 0),
(2022, 'B', 'professional', '工程管理', 179, 42, 42, 84, 0),
(2022, 'B', 'professional', '艺术', 351, 37, 37, 56, 56);

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

CREATE TABLE IF NOT EXISTS `user_blocks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '执行屏蔽的用户ID',
  `blocked_user_id` INT NOT NULL COMMENT '被屏蔽的用户ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_blocked` (`user_id`, `blocked_user_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_blocked_user` (`blocked_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户屏蔽关系表';

CREATE TABLE IF NOT EXISTS `title_certifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '申请用户ID',
  `screenshot` VARCHAR(500) NOT NULL COMMENT '上岸截图路径',
  `description` TEXT COMMENT '相关说明',
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `reviewer_id` INT DEFAULT NULL COMMENT '审核人ID',
  `review_remark` TEXT COMMENT '审核备注',
  `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='头衔认证申请表';

CREATE TABLE IF NOT EXISTS `school_websites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '学校名称',
  `website` VARCHAR(500) NOT NULL COMMENT '官网地址',
  `type` ENUM('985','211','双一流','普通') DEFAULT '普通' COMMENT '学校类型',
  `region` VARCHAR(100) DEFAULT NULL COMMENT '地区',
  `logo_url` VARCHAR(500) DEFAULT NULL COMMENT '学校logo地址',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '1启用 0禁用',
  `click_count` INT DEFAULT 0 COMMENT '点击次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_region` (`region`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学校官网表';

INSERT INTO `school_websites` (`name`, `website`, `type`, `region`, `sort_order`) VALUES
('北京大学', 'https://www.pku.edu.cn', '985', '北京', 1),
('清华大学', 'https://www.tsinghua.edu.cn', '985', '北京', 2),
('复旦大学', 'https://www.fudan.edu.cn', '985', '上海', 3),
('上海交通大学', 'https://www.sjtu.edu.cn', '985', '上海', 4),
('浙江大学', 'https://www.zju.edu.cn', '985', '浙江', 5),
('南京大学', 'https://www.nju.edu.cn', '985', '江苏', 6),
('中山大学', 'https://www.sysu.edu.cn', '985', '广东', 7),
('中国人民大学', 'https://www.ruc.edu.cn', '985', '北京', 8),
('中国科学技术大学', 'https://www.ustc.edu.cn', '985', '安徽', 9),
('华中科技大学', 'https://www.hust.edu.cn', '985', '湖北', 10);
