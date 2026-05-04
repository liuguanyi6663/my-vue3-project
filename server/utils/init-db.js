const db = require('./db')

const initDatabase = async () => {
  try {
    await require('./sensitive-words').initSensitiveWords()
  } catch (e) {
    console.log('敏感词初始化跳过')
  }
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
        mood VARCHAR(20) DEFAULT NULL COMMENT '心情:happy/calm/anxious/tired/sad',
        checkin_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES study_plans(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    const checkinColumns = await db.query('SHOW COLUMNS FROM study_checkins')
    const checkinColNames = checkinColumns.map(c => c.Field)
    if (!checkinColNames.includes('mood')) {
      await db.query("ALTER TABLE study_checkins ADD COLUMN mood VARCHAR(20) DEFAULT NULL COMMENT '心情:happy/calm/anxious/tired/sad'")
      console.log('✅ study_checkins表添加mood字段')
    }

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

    await db.query(`
      CREATE TABLE IF NOT EXISTS title_certifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '申请用户ID',
        screenshot VARCHAR(500) NOT NULL COMMENT '上岸截图路径',
        description TEXT COMMENT '相关说明',
        status ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
        reviewer_id INT DEFAULT NULL COMMENT '审核人ID',
        review_remark TEXT COMMENT '审核备注',
        reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='头衔认证申请表'
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS school_websites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL COMMENT '学校名称',
        website VARCHAR(500) NOT NULL COMMENT '官网地址',
        type ENUM('985','211','双一流','普通') DEFAULT '普通' COMMENT '学校类型',
        region VARCHAR(100) DEFAULT NULL COMMENT '地区',
        logo_url VARCHAR(500) DEFAULT NULL COMMENT '学校logo地址',
        sort_order INT DEFAULT 0 COMMENT '排序',
        status TINYINT DEFAULT 1 COMMENT '1启用 0禁用',
        click_count INT DEFAULT 0 COMMENT '点击次数',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_region (region),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学校官网表'
    `)

    await seedSchoolWebsites()

    const userColumns = await db.query('SHOW COLUMNS FROM users')
    const userColNames = userColumns.map(c => c.Field)
    if (!userColNames.includes('is_landed')) {
      await db.query("ALTER TABLE users ADD COLUMN is_landed TINYINT DEFAULT 0 COMMENT '是否已上岸认证 1是 0否'")
      console.log('✅ users表添加is_landed字段')
    }
    if (!userColNames.includes('is_deleting')) {
      await db.query("ALTER TABLE users ADD COLUMN is_deleting TINYINT DEFAULT 0 COMMENT '是否在注销冷静期 1是 0否'")
      console.log('✅ users表添加is_deleting字段')
    }
    if (!userColNames.includes('delete_request_at')) {
      await db.query("ALTER TABLE users ADD COLUMN delete_request_at DATETIME DEFAULT NULL COMMENT '注销请求时间'")
      console.log('✅ users表添加delete_request_at字段')
    }

    console.log('✅ 数据库表初始化完成')

    await seedNationalLines()
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message)
  }
}

async function seedNationalLines() {
  try {
    const count = await db.query('SELECT COUNT(*) as cnt FROM national_lines')
    if (count[0].cnt > 0) {
      console.log('📋 国家线数据已存在，跳过初始化')
      return
    }

    console.log('📋 正在初始化国家线数据...')

    const values = [
      [2025,'A','academic','哲学',321,39,39,59,59],[2025,'A','academic','经济学',323,40,40,60,60],[2025,'A','academic','法学',323,40,40,60,60],[2025,'A','academic','教育学',341,45,45,135,0],[2025,'A','academic','文学',351,47,47,71,71],[2025,'A','academic','历史学',336,43,43,129,0],[2025,'A','academic','理学',274,34,34,51,51],[2025,'A','academic','工学',260,34,34,51,51],[2025,'A','academic','农学',245,33,33,50,50],[2025,'A','academic','医学',293,36,36,108,0],[2025,'A','academic','军事学',260,34,34,51,51],[2025,'A','academic','管理学',333,41,41,62,62],[2025,'A','academic','艺术学',351,37,37,56,56],[2025,'A','academic','交叉学科',266,34,34,51,51],[2025,'A','academic','体育学',304,36,36,108,0],[2025,'A','academic','工学照顾专业',251,33,33,50,50],[2025,'A','academic','中医类照顾专业',293,36,36,108,0],
      [2025,'B','academic','哲学',311,36,36,54,54],[2025,'B','academic','经济学',313,37,37,56,56],[2025,'B','academic','法学',313,37,37,56,56],[2025,'B','academic','教育学',331,42,42,126,0],[2025,'B','academic','文学',341,44,44,66,66],[2025,'B','academic','历史学',326,40,40,120,0],[2025,'B','academic','理学',264,31,31,47,47],[2025,'B','academic','工学',250,31,31,47,47],[2025,'B','academic','农学',235,30,30,45,45],[2025,'B','academic','医学',283,33,33,99,0],[2025,'B','academic','军事学',250,31,31,47,47],[2025,'B','academic','管理学',323,38,38,57,57],[2025,'B','academic','艺术学',341,34,34,51,51],[2025,'B','academic','交叉学科',256,31,31,47,47],[2025,'B','academic','体育学',294,33,33,99,0],[2025,'B','academic','工学照顾专业',241,30,30,45,45],[2025,'B','academic','中医类照顾专业',283,33,33,99,0],
      [2025,'A','professional','金融',323,40,40,60,60],[2025,'A','professional','应用统计',323,40,40,60,60],[2025,'A','professional','税务',323,40,40,60,60],[2025,'A','professional','国际商务',323,40,40,60,60],[2025,'A','professional','保险',323,40,40,60,60],[2025,'A','professional','资产评估',323,40,40,60,60],[2025,'A','professional','审计',194,48,48,96,0],[2025,'A','professional','法律',323,40,40,60,60],[2025,'A','professional','社会工作',323,40,40,60,60],[2025,'A','professional','警务',323,40,40,60,60],[2025,'A','professional','教育',341,45,45,68,68],[2025,'A','professional','体育',304,36,36,108,0],[2025,'A','professional','国际中文教育',341,45,45,68,68],[2025,'A','professional','应用心理',341,45,45,135,0],[2025,'A','professional','翻译',351,47,47,71,71],[2025,'A','professional','新闻与传播',351,47,47,71,71],[2025,'A','professional','出版',351,47,47,71,71],[2025,'A','professional','文物与博物馆',336,43,43,129,0],[2025,'A','professional','建筑学',260,34,34,51,51],[2025,'A','professional','城市规划',260,34,34,51,51],[2025,'A','professional','电子信息',260,34,34,51,51],[2025,'A','professional','机械',260,34,34,51,51],[2025,'A','professional','材料与化工',260,34,34,51,51],[2025,'A','professional','资源与环境',260,34,34,51,51],[2025,'A','professional','能源动力',260,34,34,51,51],[2025,'A','professional','土木水利',260,34,34,51,51],[2025,'A','professional','生物与医药',260,34,34,51,51],[2025,'A','professional','交通运输',260,34,34,51,51],[2025,'A','professional','农业',245,33,33,50,50],[2025,'A','professional','兽医',245,33,33,50,50],[2025,'A','professional','风景园林',245,33,33,50,50],[2025,'A','professional','林业',245,33,33,50,50],[2025,'A','professional','临床医学',293,36,36,108,0],[2025,'A','professional','口腔医学',293,36,36,108,0],[2025,'A','professional','公共卫生',293,36,36,108,0],[2025,'A','professional','护理',293,36,36,108,0],[2025,'A','professional','药学',293,36,36,108,0],[2025,'A','professional','中药学',293,36,36,108,0],[2025,'A','professional','中医',293,36,36,108,0],[2025,'A','professional','工商管理',151,35,35,70,0],[2025,'A','professional','旅游管理',151,35,35,70,0],[2025,'A','professional','公共管理',164,38,38,76,0],[2025,'A','professional','会计',194,48,48,96,0],[2025,'A','professional','图书情报',191,48,48,96,0],[2025,'A','professional','工程管理',162,38,38,76,0],[2025,'A','professional','艺术',351,37,37,56,56],
      [2025,'B','professional','金融',313,37,37,56,56],[2025,'B','professional','应用统计',313,37,37,56,56],[2025,'B','professional','税务',313,37,37,56,56],[2025,'B','professional','国际商务',313,37,37,56,56],[2025,'B','professional','保险',313,37,37,56,56],[2025,'B','professional','资产评估',313,37,37,56,56],[2025,'B','professional','审计',184,43,43,86,0],[2025,'B','professional','法律',313,37,37,56,56],[2025,'B','professional','社会工作',313,37,37,56,56],[2025,'B','professional','教育',331,42,42,63,63],[2025,'B','professional','体育',294,33,33,99,0],[2025,'B','professional','国际中文教育',331,42,42,63,63],[2025,'B','professional','应用心理',331,42,42,126,0],[2025,'B','professional','翻译',341,44,44,66,66],[2025,'B','professional','新闻与传播',341,44,44,66,66],[2025,'B','professional','出版',341,44,44,66,66],[2025,'B','professional','文物与博物馆',326,40,40,120,0],[2025,'B','professional','电子信息',250,31,31,47,47],[2025,'B','professional','机械',250,31,31,47,47],[2025,'B','professional','临床医学',283,33,33,99,0],[2025,'B','professional','工商管理',141,30,30,60,0],[2025,'B','professional','旅游管理',141,30,30,60,0],[2025,'B','professional','公共管理',154,33,33,66,0],[2025,'B','professional','会计',184,43,43,86,0],[2025,'B','professional','图书情报',181,43,43,86,0],[2025,'B','professional','工程管理',152,33,33,66,0],[2025,'B','professional','艺术',341,34,34,51,51],
      [2024,'A','academic','哲学',333,47,47,71,71],[2024,'A','academic','经济学',338,47,47,71,71],[2024,'A','academic','法学',331,47,47,71,71],[2024,'A','academic','教育学',350,51,51,153,0],[2024,'A','academic','文学',365,55,55,83,83],[2024,'A','academic','历史学',345,49,49,147,0],[2024,'A','academic','理学',288,41,41,62,62],[2024,'A','academic','工学',273,37,37,56,56],[2024,'A','academic','农学',251,33,33,50,50],[2024,'A','academic','医学',304,42,42,126,0],[2024,'A','academic','军事学',260,35,35,53,53],[2024,'A','academic','管理学',347,49,49,74,74],[2024,'A','academic','艺术学',362,40,40,60,60],[2024,'A','academic','交叉学科',275,39,39,59,59],[2024,'A','academic','体育学',313,41,41,123,0],[2024,'A','academic','工学照顾专业',260,35,35,53,53],[2024,'A','academic','中医类照顾专业',303,42,42,126,0],
      [2024,'B','academic','哲学',323,44,44,66,66],[2024,'B','academic','经济学',328,44,44,66,66],[2024,'B','academic','法学',321,44,44,66,66],[2024,'B','academic','教育学',340,48,48,144,0],[2024,'B','academic','文学',355,52,52,78,78],[2024,'B','academic','历史学',335,46,46,138,0],[2024,'B','academic','理学',278,38,38,57,57],[2024,'B','academic','工学',263,34,34,51,51],[2024,'B','academic','农学',241,30,30,45,45],[2024,'B','academic','医学',294,39,39,117,0],[2024,'B','academic','军事学',250,32,32,48,48],[2024,'B','academic','管理学',337,46,46,69,69],[2024,'B','academic','艺术学',352,37,37,56,56],[2024,'B','academic','交叉学科',265,36,36,54,54],[2024,'B','academic','体育学',303,38,38,114,0],[2024,'B','academic','工学照顾专业',250,32,32,48,48],[2024,'B','academic','中医类照顾专业',293,39,39,117,0],
      [2024,'A','professional','金融',338,47,47,71,71],[2024,'A','professional','应用统计',338,47,47,71,71],[2024,'A','professional','税务',338,47,47,71,71],[2024,'A','professional','国际商务',338,47,47,71,71],[2024,'A','professional','保险',338,47,47,71,71],[2024,'A','professional','资产评估',338,47,47,71,71],[2024,'A','professional','审计',201,52,52,104,0],[2024,'A','professional','法律',331,47,47,71,71],[2024,'A','professional','社会工作',331,47,47,71,71],[2024,'A','professional','教育',350,51,51,77,77],[2024,'A','professional','国际中文教育',350,51,51,77,77],[2024,'A','professional','体育',313,41,41,123,0],[2024,'A','professional','应用心理',350,51,51,153,0],[2024,'A','professional','翻译',365,55,55,83,83],[2024,'A','professional','新闻与传播',365,55,55,83,83],[2024,'A','professional','出版',365,55,55,83,83],[2024,'A','professional','文物与博物馆',345,49,49,147,0],[2024,'A','professional','建筑学',273,37,37,56,56],[2024,'A','professional','电子信息',273,37,37,56,56],[2024,'A','professional','机械',273,37,37,56,56],[2024,'A','professional','材料与化工',273,37,37,56,56],[2024,'A','professional','资源与环境',273,37,37,56,56],[2024,'A','professional','能源动力',273,37,37,56,56],[2024,'A','professional','土木水利',273,37,37,56,56],[2024,'A','professional','生物与医药',273,37,37,56,56],[2024,'A','professional','交通运输',273,37,37,56,56],[2024,'A','professional','农业',251,33,33,50,50],[2024,'A','professional','兽医',251,33,33,50,50],[2024,'A','professional','风景园林',251,33,33,50,50],[2024,'A','professional','林业',251,33,33,50,50],[2024,'A','professional','临床医学',304,42,42,126,0],[2024,'A','professional','口腔医学',304,42,42,126,0],[2024,'A','professional','公共卫生',304,42,42,126,0],[2024,'A','professional','护理',304,42,42,126,0],[2024,'A','professional','药学',304,42,42,126,0],[2024,'A','professional','中药学',304,42,42,126,0],[2024,'A','professional','中医',303,42,42,126,0],[2024,'A','professional','工商管理',162,39,39,78,0],[2024,'A','professional','旅游管理',162,39,39,78,0],[2024,'A','professional','公共管理',173,43,43,86,0],[2024,'A','professional','会计',201,52,52,104,0],[2024,'A','professional','图书情报',198,51,51,102,0],[2024,'A','professional','工程管理',176,43,43,86,0],[2024,'A','professional','艺术',362,40,40,60,60],
      [2024,'B','professional','金融',328,44,44,66,66],[2024,'B','professional','法律',321,44,44,66,66],[2024,'B','professional','教育',340,48,48,72,72],[2024,'B','professional','体育',303,38,38,114,0],[2024,'B','professional','翻译',355,52,52,78,78],[2024,'B','professional','电子信息',263,34,34,51,51],[2024,'B','professional','临床医学',294,39,39,117,0],[2024,'B','professional','中医',293,39,39,117,0],[2024,'B','professional','工商管理',152,34,34,68,0],[2024,'B','professional','公共管理',163,38,38,76,0],[2024,'B','professional','会计',191,47,47,94,0],[2024,'B','professional','图书情报',188,46,46,92,0],[2024,'B','professional','工程管理',166,38,38,76,0],[2024,'B','professional','艺术',352,37,37,56,56],
      [2023,'A','academic','哲学',323,45,45,68,68],[2023,'A','academic','经济学',346,48,48,72,72],[2023,'A','academic','法学',326,45,45,68,68],[2023,'A','academic','教育学',350,51,51,153,0],[2023,'A','academic','文学',363,54,54,81,81],[2023,'A','academic','历史学',336,46,46,138,0],[2023,'A','academic','理学',279,38,38,57,57],[2023,'A','academic','工学',273,38,38,57,57],[2023,'A','academic','农学',251,33,33,50,50],[2023,'A','academic','医学',296,39,39,117,0],[2023,'A','academic','军事学',260,35,35,53,53],[2023,'A','academic','管理学',340,47,47,71,71],[2023,'A','academic','艺术学',362,40,40,60,60],[2023,'A','academic','交叉学科',265,36,36,54,54],[2023,'A','academic','体育学',305,39,39,117,0],[2023,'A','academic','工学照顾专业',260,35,35,53,53],[2023,'A','academic','中医类照顾专业',295,39,39,117,0],
      [2023,'B','academic','哲学',313,42,42,63,63],[2023,'B','academic','经济学',336,45,45,68,68],[2023,'B','academic','法学',316,42,42,63,63],[2023,'B','academic','教育学',340,48,48,144,0],[2023,'B','academic','文学',353,51,51,77,77],[2023,'B','academic','历史学',326,43,43,129,0],[2023,'B','academic','理学',269,35,35,53,53],[2023,'B','academic','工学',263,35,35,53,53],[2023,'B','academic','农学',241,30,30,45,45],[2023,'B','academic','医学',286,36,36,108,0],[2023,'B','academic','军事学',250,32,32,48,48],[2023,'B','academic','管理学',330,44,44,66,66],[2023,'B','academic','艺术学',352,37,37,56,56],[2023,'B','academic','交叉学科',255,33,33,50,50],[2023,'B','academic','体育学',295,36,36,108,0],[2023,'B','academic','工学照顾专业',250,32,32,48,48],[2023,'B','academic','中医类照顾专业',285,36,36,108,0],
      [2023,'A','professional','金融',346,48,48,72,72],[2023,'A','professional','应用统计',346,48,48,72,72],[2023,'A','professional','税务',346,48,48,72,72],[2023,'A','professional','国际商务',346,48,48,72,72],[2023,'A','professional','保险',346,48,48,72,72],[2023,'A','professional','资产评估',346,48,48,72,72],[2023,'A','professional','审计',197,50,50,100,0],[2023,'A','professional','法律',326,45,45,68,68],[2023,'A','professional','社会工作',326,45,45,68,68],[2023,'A','professional','教育',350,51,51,77,77],[2023,'A','professional','国际中文教育',350,51,51,77,77],[2023,'A','professional','体育',305,39,39,117,0],[2023,'A','professional','应用心理',350,51,51,153,0],[2023,'A','professional','翻译',363,54,54,81,81],[2023,'A','professional','新闻与传播',363,54,54,81,81],[2023,'A','professional','出版',363,54,54,81,81],[2023,'A','professional','文物与博物馆',336,46,46,138,0],[2023,'A','professional','建筑学',273,38,38,57,57],[2023,'A','professional','电子信息',273,38,38,57,57],[2023,'A','professional','机械',273,38,38,57,57],[2023,'A','professional','材料与化工',273,38,38,57,57],[2023,'A','professional','资源与环境',273,38,38,57,57],[2023,'A','professional','能源动力',273,38,38,57,57],[2023,'A','professional','土木水利',273,38,38,57,57],[2023,'A','professional','生物与医药',273,38,38,57,57],[2023,'A','professional','交通运输',273,38,38,57,57],[2023,'A','professional','农业',251,33,33,50,50],[2023,'A','professional','兽医',251,33,33,50,50],[2023,'A','professional','风景园林',251,33,33,50,50],[2023,'A','professional','林业',251,33,33,50,50],[2023,'A','professional','临床医学',296,39,39,117,0],[2023,'A','professional','口腔医学',296,39,39,117,0],[2023,'A','professional','公共卫生',296,39,39,117,0],[2023,'A','professional','护理',296,39,39,117,0],[2023,'A','professional','药学',296,39,39,117,0],[2023,'A','professional','中药学',296,39,39,117,0],[2023,'A','professional','中医',295,39,39,117,0],[2023,'A','professional','工商管理',167,41,41,82,0],[2023,'A','professional','旅游管理',167,41,41,82,0],[2023,'A','professional','公共管理',175,44,44,88,0],[2023,'A','professional','会计',197,50,50,100,0],[2023,'A','professional','图书情报',198,52,52,104,0],[2023,'A','professional','工程管理',178,44,44,88,0],[2023,'A','professional','艺术',362,40,40,60,60],
      [2023,'B','professional','金融',336,45,45,68,68],[2023,'B','professional','法律',316,42,42,63,63],[2023,'B','professional','教育',340,48,48,72,72],[2023,'B','professional','体育',295,36,36,108,0],[2023,'B','professional','翻译',353,51,51,77,77],[2023,'B','professional','电子信息',263,35,35,53,53],[2023,'B','professional','临床医学',286,36,36,108,0],[2023,'B','professional','中医',285,36,36,108,0],[2023,'B','professional','工商管理',157,36,36,72,0],[2023,'B','professional','公共管理',165,39,39,78,0],[2023,'B','professional','会计',187,45,45,90,0],[2023,'B','professional','图书情报',188,47,47,94,0],[2023,'B','professional','工程管理',168,39,39,78,0],[2023,'B','professional','艺术',352,37,37,56,56],
      [2022,'A','academic','哲学',314,45,45,68,68],[2022,'A','academic','经济学',360,52,52,78,78],[2022,'A','academic','法学',335,46,46,69,69],[2022,'A','academic','教育学',351,51,51,153,0],[2022,'A','academic','文学',367,56,56,84,84],[2022,'A','academic','历史学',336,46,46,138,0],[2022,'A','academic','理学',290,39,39,59,59],[2022,'A','academic','工学',273,38,38,57,57],[2022,'A','academic','农学',252,33,33,50,50],[2022,'A','academic','医学',309,43,43,129,0],[2022,'A','academic','军事学',265,37,37,56,56],[2022,'A','academic','管理学',353,51,51,77,77],[2022,'A','academic','艺术学',361,40,40,60,60],[2022,'A','academic','体育学',296,37,37,111,0],[2022,'A','academic','工学照顾专业',260,35,35,53,53],[2022,'A','academic','中医类照顾专业',306,41,41,123,0],
      [2022,'B','academic','哲学',304,42,42,63,63],[2022,'B','academic','经济学',350,49,49,74,74],[2022,'B','academic','法学',325,43,43,65,65],[2022,'B','academic','教育学',341,48,48,144,0],[2022,'B','academic','文学',357,53,53,80,80],[2022,'B','academic','历史学',326,43,43,129,0],[2022,'B','academic','理学',280,36,36,54,54],[2022,'B','academic','工学',263,35,35,53,53],[2022,'B','academic','农学',242,30,30,45,45],[2022,'B','academic','医学',299,40,40,120,0],[2022,'B','academic','军事学',255,34,34,51,51],[2022,'B','academic','管理学',343,48,48,72,72],[2022,'B','academic','艺术学',351,37,37,56,56],[2022,'B','academic','体育学',286,34,34,102,0],[2022,'B','academic','工学照顾专业',250,32,32,48,48],[2022,'B','academic','中医类照顾专业',296,38,38,114,0],
      [2022,'A','professional','金融',360,52,52,78,78],[2022,'A','professional','应用统计',360,52,52,78,78],[2022,'A','professional','税务',360,52,52,78,78],[2022,'A','professional','国际商务',360,52,52,78,78],[2022,'A','professional','保险',360,52,52,78,78],[2022,'A','professional','资产评估',360,52,52,78,78],[2022,'A','professional','审计',194,50,50,100,0],[2022,'A','professional','法律',335,46,46,69,69],[2022,'A','professional','社会工作',335,46,46,69,69],[2022,'A','professional','教育',351,51,51,77,77],[2022,'A','professional','汉语国际教育',351,51,51,77,77],[2022,'A','professional','体育',296,37,37,111,0],[2022,'A','professional','应用心理',351,51,51,153,0],[2022,'A','professional','翻译',367,56,56,84,84],[2022,'A','professional','新闻与传播',367,56,56,84,84],[2022,'A','professional','出版',367,56,56,84,84],[2022,'A','professional','文物与博物馆',336,46,46,138,0],[2022,'A','professional','建筑学',273,38,38,57,57],[2022,'A','professional','电子信息',273,38,38,57,57],[2022,'A','professional','机械',273,38,38,57,57],[2022,'A','professional','材料与化工',273,38,38,57,57],[2022,'A','professional','资源与环境',273,38,38,57,57],[2022,'A','professional','能源动力',273,38,38,57,57],[2022,'A','professional','土木水利',273,38,38,57,57],[2022,'A','professional','生物与医药',273,38,38,57,57],[2022,'A','professional','交通运输',273,38,38,57,57],[2022,'A','professional','农业',252,33,33,50,50],[2022,'A','professional','兽医',252,33,33,50,50],[2022,'A','professional','风景园林',252,33,33,50,50],[2022,'A','professional','林业',252,33,33,50,50],[2022,'A','professional','临床医学',309,43,43,129,0],[2022,'A','professional','口腔医学',309,43,43,129,0],[2022,'A','professional','公共卫生',309,43,43,129,0],[2022,'A','professional','护理',309,43,43,129,0],[2022,'A','professional','药学',309,43,43,129,0],[2022,'A','professional','中药学',309,43,43,129,0],[2022,'A','professional','中医',306,41,41,123,0],[2022,'A','professional','军事',265,37,37,56,56],[2022,'A','professional','工商管理',170,42,42,84,0],[2022,'A','professional','旅游管理',170,42,42,84,0],[2022,'A','professional','公共管理',178,45,45,90,0],[2022,'A','professional','会计',193,50,50,100,0],[2022,'A','professional','图书情报',194,50,50,100,0],[2022,'A','professional','工程管理',189,47,47,94,0],[2022,'A','professional','艺术',361,40,40,60,60],
      [2022,'B','professional','金融',350,49,49,74,74],[2022,'B','professional','法律',325,43,43,65,65],[2022,'B','professional','教育',341,48,48,72,72],[2022,'B','professional','体育',286,34,34,102,0],[2022,'B','professional','翻译',357,53,53,80,80],[2022,'B','professional','电子信息',263,35,35,53,53],[2022,'B','professional','临床医学',299,40,40,120,0],[2022,'B','professional','中医',296,38,38,114,0],[2022,'B','professional','工商管理',160,37,37,74,0],[2022,'B','professional','公共管理',168,40,40,80,0],[2022,'B','professional','会计',183,45,45,90,0],[2022,'B','professional','图书情报',184,45,45,90,0],[2022,'B','professional','工程管理',179,42,42,84,0],[2022,'B','professional','艺术',351,37,37,56,56]
    ]

    const batchSize = 50
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize)
      const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')
      const flatValues = batch.flat()
      await db.query(
        `INSERT IGNORE INTO national_lines (year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score) VALUES ${placeholders}`,
        flatValues
      )
    }

    console.log(`✅ 国家线数据初始化完成，共插入 ${values.length} 条记录`)
  } catch (err) {
    console.error('❌ 国家线数据初始化失败:', err.message)
  }
}

async function seedSchoolWebsites() {
  try {
    const count = await db.query('SELECT COUNT(*) as cnt FROM school_websites')
    if (count[0].cnt > 0) {
      console.log('🏫 学校官网数据已存在，跳过初始化')
      return
    }

    console.log('🏫 正在初始化学校官网数据...')

    const schools = [
      ['北京大学','https://www.pku.edu.cn','985','北京',1],
      ['清华大学','https://www.tsinghua.edu.cn','985','北京',2],
      ['复旦大学','https://www.fudan.edu.cn','985','上海',3],
      ['上海交通大学','https://www.sjtu.edu.cn','985','上海',4],
      ['浙江大学','https://www.zju.edu.cn','985','浙江',5],
      ['南京大学','https://www.nju.edu.cn','985','江苏',6],
      ['中山大学','https://www.sysu.edu.cn','985','广东',7],
      ['中国人民大学','https://www.ruc.edu.cn','985','北京',8],
      ['中国科学技术大学','https://www.ustc.edu.cn','985','安徽',9],
      ['华中科技大学','https://www.hust.edu.cn','985','湖北',10]
    ]

    for (const school of schools) {
      await db.query(
        `INSERT IGNORE INTO school_websites (name, website, type, region, sort_order) VALUES (?, ?, ?, ?, ?)`,
        school
      )
    }

    console.log(`✅ 学校官网数据初始化完成，共插入 ${schools.length} 条记录`)
  } catch (err) {
    console.error('❌ 学校官网数据初始化失败:', err.message)
  }
}

module.exports = initDatabase
