const db = require('./db')

const initDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255),
        nickname VARCHAR(100),
        avatar VARCHAR(500),
        phone VARCHAR(20),
        openid VARCHAR(100),
        college VARCHAR(100),
        major VARCHAR(100),
        student_id VARCHAR(50),
        target_school VARCHAR(200) DEFAULT NULL,
        target_major VARCHAR(100) DEFAULT NULL,
        exam_year YEAR DEFAULT NULL,
        role ENUM('student', 'admin', 'super_admin') DEFAULT 'student',
        status TINYINT DEFAULT 1,
        is_banned TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    const columns = await db.query('SHOW COLUMNS FROM users')
    const columnNames = columns.map(c => c.Field)
    const alterStatements = []
    if (!columnNames.includes('target_school')) {
      alterStatements.push("ADD COLUMN target_school VARCHAR(200) DEFAULT NULL COMMENT '目标院校'")
    }
    if (!columnNames.includes('target_major')) {
      alterStatements.push("ADD COLUMN target_major VARCHAR(100) DEFAULT NULL COMMENT '目标专业'")
    }
    if (!columnNames.includes('exam_year')) {
      alterStatements.push("ADD COLUMN exam_year YEAR DEFAULT NULL COMMENT '考研年份'")
    }
    if (!columnNames.includes('is_banned')) {
      alterStatements.push("ADD COLUMN is_banned TINYINT DEFAULT 0 COMMENT '是否禁言'")
    }
    if (alterStatements.length > 0) {
      await db.query(`ALTER TABLE users ${alterStatements.join(', ')}`)
      console.log('✅ users表字段迁移完成')
    }

    const roleColumn = columns.find(c => c.Field === 'role')
    if (roleColumn && roleColumn.Type && !roleColumn.Type.includes('super_admin')) {
      await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('student','admin','super_admin') DEFAULT 'student'")
      console.log('✅ role字段枚举迁移完成，已添加super_admin')
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS study_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        subject VARCHAR(50) NOT NULL,
        task_name VARCHAR(100) NOT NULL,
        plan_duration INT DEFAULT 60,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        plan_date DATE NOT NULL,
        template_type VARCHAR(30),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS study_checkins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        plan_id INT,
        subject VARCHAR(50) NOT NULL,
        task_name VARCHAR(100) NOT NULL,
        duration INT DEFAULT 0,
        remark TEXT,
        checkin_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES study_plans(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        category VARCHAR(30) NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        images JSON,
        tags JSON,
        is_anonymous TINYINT DEFAULT 0,
        audit_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        status TINYINT DEFAULT 1,
        is_top TINYINT DEFAULT 0,
        view_count INT DEFAULT 0,
        like_count INT DEFAULT 0,
        comment_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS forum_comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT DEFAULT 0,
        content TEXT NOT NULL,
        status TINYINT DEFAULT 1,
        like_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES forum_posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS forum_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        target_id INT NOT NULL,
        target_type ENUM('post', 'comment') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (user_id, target_id, target_type),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS forum_favorites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES forum_posts(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS sensitive_words (
        id INT PRIMARY KEY AUTO_INCREMENT,
        word VARCHAR(50) NOT NULL UNIQUE,
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reporter_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        target_id INT NOT NULL,
        reason VARCHAR(50) NOT NULL,
        description TEXT,
        status ENUM('pending', 'processed', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        handler_id INT DEFAULT NULL,
        handle_result TEXT,
        handled_at DATETIME DEFAULT NULL,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // 确保 target_type 是 VARCHAR 类型（不是 ENUM）
    try {
      const columns = await db.query('SHOW COLUMNS FROM reports WHERE Field = "target_type"')
      if (columns[0].Type.includes('enum')) {
        console.log('Converting target_type from ENUM to VARCHAR...')
        await db.query('ALTER TABLE reports MODIFY COLUMN target_type VARCHAR(20) NOT NULL')
        console.log('Converted!')
      }
      
      // 确保 handler_id, handle_result, handled_at 存在
      const allColumns = await db.query('SHOW COLUMNS FROM reports')
      const colNames = allColumns.map(c => c.Field)
      
      if (!colNames.includes('handler_id')) {
        await db.query('ALTER TABLE reports ADD COLUMN handler_id INT DEFAULT NULL')
        console.log('Added handler_id column!')
      }
      if (!colNames.includes('handle_result')) {
        await db.query('ALTER TABLE reports ADD COLUMN handle_result TEXT')
        console.log('Added handle_result column!')
      }
      if (!colNames.includes('handled_at')) {
        await db.query('ALTER TABLE reports ADD COLUMN handled_at DATETIME DEFAULT NULL')
        console.log('Added handled_at column!')
      }
    } catch (err) {
      console.log('Table migration check complete:', err.message)
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS student_kaoyan_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(50) NOT NULL COMMENT '姓名',
        major VARCHAR(100) NOT NULL COMMENT '专业',
        student_id VARCHAR(50) NOT NULL COMMENT '学号',
        exam_subjects VARCHAR(200) NOT NULL COMMENT '考研科目',
        is_cross_major TINYINT DEFAULT 0 COMMENT '是否跨考 1是 0否',
        is_admitted TINYINT DEFAULT 0 COMMENT '是否上岸 1是 0否',
        math_score DECIMAL(5,2) DEFAULT NULL COMMENT '数学成绩',
        english_score DECIMAL(5,2) DEFAULT NULL COMMENT '英语成绩',
        politics_score DECIMAL(5,2) DEFAULT NULL COMMENT '政治成绩',
        professional_score DECIMAL(5,2) DEFAULT NULL COMMENT '专业课成绩',
        is_pass_line TINYINT DEFAULT 0 COMMENT '是否过专业线 1是 0否',
        target_school VARCHAR(200) NOT NULL COMMENT '目标院校',
      target_major VARCHAR(100) DEFAULT NULL COMMENT '目标专业',
      school_level VARCHAR(50) DEFAULT NULL COMMENT '院校层次：985/211/双一流/普通本科高校',
        exam_year YEAR DEFAULT NULL COMMENT '考研年份',
        status ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_student_id (student_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生考研信息录入表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS material_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        parent_id INT DEFAULT 0,
        level TINYINT DEFAULT 1,
        type ENUM('public','major','notes','interview','exam') DEFAULT 'public',
        college VARCHAR(100) DEFAULT NULL,
        major VARCHAR(100) DEFAULT NULL,
        sort_order INT DEFAULT 0,
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parent (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        file_name VARCHAR(200) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT DEFAULT 0,
        file_type VARCHAR(50) DEFAULT NULL,
        uploader_id INT NOT NULL,
        year YEAR DEFAULT NULL,
        download_count INT DEFAULT 0,
        view_count INT DEFAULT 0,
        avg_score DECIMAL(2,1) DEFAULT 0,
        review_count INT DEFAULT 0,
        like_count INT DEFAULT 0,
        audit_status ENUM('pending','approved','rejected') DEFAULT 'pending',
        status TINYINT DEFAULT 1,
        is_watermarked TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_uploader (uploader_id),
        INDEX idx_audit_status (audit_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    const matColumns = await db.query('SHOW COLUMNS FROM materials')
    const matColumnNames = matColumns.map(c => c.Field)
    if (!matColumnNames.includes('like_count')) {
      await db.query("ALTER TABLE materials ADD COLUMN like_count INT DEFAULT 0 COMMENT '点赞数'")
      console.log('✅ materials表添加like_count字段')
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS material_reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        material_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT DEFAULT 0,
        reply_to_user_id INT DEFAULT 0,
        score TINYINT DEFAULT NULL,
        comment TEXT,
        like_count INT DEFAULT 0,
        reply_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_material (material_id),
        INDEX idx_parent (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS review_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        review_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_review (user_id, review_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS material_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        material_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_material (user_id, material_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS material_favorites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        material_id INT NOT NULL,
        folder_id INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_material (user_id, material_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS material_folders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS download_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        material_id INT NOT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_material (material_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    const count = await db.query('SELECT COUNT(*) as cnt FROM sensitive_words')
    if (count[0].cnt === 0) {
      await db.query(`INSERT INTO sensitive_words (word) VALUES 
        ('广告'), ('QQ'), ('微信'), ('加群'), ('代写'), ('作弊'), 
        ('刷单'), ('兼职'), ('赚钱'), ('色情'), ('赌博'), ('政治')`)
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS national_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        year YEAR NOT NULL COMMENT '年份',
        region ENUM('A', 'B') NOT NULL COMMENT 'A区/B区',
        category ENUM('academic', 'professional') NOT NULL COMMENT '学术型/专业型',
        subject_type VARCHAR(50) NOT NULL COMMENT '学科门类',
        total_score INT NOT NULL COMMENT '总分线',
        politics_score INT DEFAULT NULL COMMENT '政治线',
        foreign_score INT DEFAULT NULL COMMENT '外语线',
        subject1_score INT DEFAULT NULL COMMENT '业务课一线',
        subject2_score INT DEFAULT NULL COMMENT '业务课二线',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_year (year),
        INDEX idx_region_category (region, category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国家线数据表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS oral_questions_user (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '上传用户ID',
        question_en VARCHAR(500) NOT NULL COMMENT '英文问题',
        question_cn VARCHAR(500) DEFAULT NULL COMMENT '中文翻译',
        reference_answer TEXT COMMENT '参考回答',
        category VARCHAR(100) DEFAULT NULL COMMENT '分类',
        audit_status ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_audit_status (audit_status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传口语题库表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS resume_templates_user (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '上传用户ID',
        name VARCHAR(200) NOT NULL COMMENT '模板名称',
        \`desc\` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
        file_name VARCHAR(200) NOT NULL COMMENT '文件名',
        file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
        file_size BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
        download_count INT DEFAULT 0 COMMENT '下载次数',
        audit_status ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_audit_status (audit_status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传简历模板表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS email_templates_user (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '上传用户ID',
        name VARCHAR(200) NOT NULL COMMENT '模板名称',
        \`desc\` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
        file_name VARCHAR(200) NOT NULL COMMENT '文件名',
        file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
        file_size BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
        download_count INT DEFAULT 0 COMMENT '下载次数',
        audit_status ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_audit_status (audit_status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传邮件模板表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '反馈用户ID',
        content TEXT NOT NULL COMMENT '反馈内容',
        status ENUM('pending','processed') DEFAULT 'pending' COMMENT '处理状态',
        handler_id INT DEFAULT NULL COMMENT '处理人ID',
        handle_result TEXT COMMENT '处理结果',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        handled_at DATETIME DEFAULT NULL,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='意见反馈表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_blocks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '执行屏蔽的用户ID',
        blocked_user_id INT NOT NULL COMMENT '被屏蔽的用户ID',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_blocked (user_id, blocked_user_id),
        INDEX idx_user (user_id),
        INDEX idx_blocked_user (blocked_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户屏蔽关系表'
    `)

    console.log('✅ 数据库表初始化完成')
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message)
  }
}

module.exports = initDatabase
