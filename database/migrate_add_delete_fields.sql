-- 添加注销功能相关字段的迁移脚本

USE `kaoyan_db`;

-- 添加 is_deleting 和 delete_request_at 字段到 users 表
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `is_deleting` TINYINT DEFAULT 0 COMMENT '是否在注销冷静期 1是 0否' AFTER `is_landed`,
ADD COLUMN IF NOT EXISTS `delete_request_at` DATETIME DEFAULT NULL COMMENT '注销请求时间' AFTER `is_deleting`;

-- 添加索引
CREATE INDEX IF NOT EXISTS `idx_is_deleting` ON `users` (`is_deleting`);
