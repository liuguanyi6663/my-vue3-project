const db = require('../server/utils/db')

async function migrate() {
  try {
    console.log('开始添加唯一约束...')
    
    // 添加 phone 的唯一约束
    try {
      await db.query('ALTER TABLE users ADD UNIQUE KEY uk_phone (phone)')
      console.log('✓ 添加 phone 唯一约束成功')
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('✓ phone 唯一约束已存在')
      } else if (e.code === 'ER_DUP_ENTRY') {
        console.error('✗ 添加 phone 唯一约束失败：表中存在重复的手机号')
        console.error('请先清理重复数据后再运行此脚本')
        
        // 查询重复的手机号
        const duplicates = await db.query(`
          SELECT phone, COUNT(*) as count 
          FROM users 
          WHERE phone IS NOT NULL 
          GROUP BY phone 
          HAVING count > 1
        `)
        console.log('重复的手机号：', duplicates)
      } else {
        throw e
      }
    }
    
    // 添加 openid 的唯一约束
    try {
      await db.query('ALTER TABLE users ADD UNIQUE KEY uk_openid (openid)')
      console.log('✓ 添加 openid 唯一约束成功')
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('✓ openid 唯一约束已存在')
      } else if (e.code === 'ER_DUP_ENTRY') {
        console.error('✗ 添加 openid 唯一约束失败：表中存在重复的 openid')
        console.error('请先清理重复数据后再运行此脚本')
        
        // 查询重复的 openid
        const duplicates = await db.query(`
          SELECT openid, COUNT(*) as count 
          FROM users 
          WHERE openid IS NOT NULL 
          GROUP BY openid 
          HAVING count > 1
        `)
        console.log('重复的 openid：', duplicates)
      } else {
        throw e
      }
    }
    
    console.log('\n迁移完成！')
    process.exit(0)
  } catch (e) {
    console.error('迁移失败：', e)
    process.exit(1)
  }
}

migrate()
