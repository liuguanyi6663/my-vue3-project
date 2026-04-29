const db = require('./server/utils/db')

async function migrateReportsTable() {
  try {
    console.log('Starting reports table migration...')
    
    // 检查当前表结构
    const columns = await db.query('SHOW COLUMNS FROM reports WHERE Field = "target_type"')
    console.log('Current target_type column:', columns[0])
    
    // 如果是 ENUM 类型，修改为 VARCHAR
    if (columns[0].Type.includes('enum')) {
      console.log('Converting target_type from ENUM to VARCHAR...')
      await db.query('ALTER TABLE reports MODIFY COLUMN target_type VARCHAR(20) NOT NULL')
      console.log('Successfully converted to VARCHAR!')
    } else {
      console.log('target_type is already VARCHAR, no migration needed.')
    }
    
    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
  
  // 关闭连接
  process.exit(0)
}

migrateReportsTable()
