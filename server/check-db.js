
const db = require('./utils/db')

async function checkAndFix() {
  try {
    // 先查看表结构
    const structure = await db.query("SHOW CREATE TABLE forum_posts")
    console.log('📋 表结构:')
    console.log(structure[0]['Create Table'])
    
    // 尝试修改 category 为 VARCHAR(50) 确保足够大
    console.log('\n🔧 尝试修改列...')
    await db.query(`ALTER TABLE forum_posts MODIFY COLUMN category VARCHAR(50) NOT NULL`)
    console.log('✅ 列修改成功！')
    
  } catch (err) {
    console.error('❌ 错误:', err.message)
  } finally {
    process.exit()
  }
}

checkAndFix()

