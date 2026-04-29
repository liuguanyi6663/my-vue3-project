const db = require('./server/utils/db')

async function upgradeAdmin() {
  console.log('Starting admin upgrade...\n')
  
  try {
    const existingAdmins = await db.query('SELECT * FROM users WHERE role = ?', ['admin'])
    
    if (existingAdmins.length > 0) {
      console.log('Found admin accounts, upgrading first one to super admin...')
      const adminToUpgrade = existingAdmins[0]
      await db.query('UPDATE users SET role = ? WHERE id = ?', ['super_admin', adminToUpgrade.id])
      
      console.log('\nSuccessfully upgraded account to super admin:')
      console.log('   - ID: ' + adminToUpgrade.id)
      console.log('   - Nickname: ' + (adminToUpgrade.nickname || 'Not set'))
    }
    
    const users = await db.query('SELECT id, nickname, role FROM users')
    console.log('\nCurrent users:')
    users.forEach(user => {
      console.log('   - ID: ' + user.id + ', Nickname: ' + user.nickname + ', Role: ' + user.role)
    })
    
  } catch (err) {
    console.error('Upgrade failed:', err.message)
  }
  
  process.exit(0)
}

upgradeAdmin()
