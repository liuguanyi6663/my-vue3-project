
const db = require('./server/utils/db')

async function createSuperAdmin() {
  console.log('Starting to create super admin account...\n')
  
  try {
    // Check if super admin already exists
    const existingSuperAdmins = await db.query('SELECT * FROM users WHERE role = ?', ['super_admin'])
    
    if (existingSuperAdmins.length &gt; 0) {
      console.log('Super admin account already exists:')
      for (let i = 0; i &lt; existingSuperAdmins.length; i++) {
        const admin = existingSuperAdmins[i]
        console.log('   - ID: ' + admin.id + ', Nickname: ' + (admin.nickname || 'Not set') + ', Phone: ' + (admin.phone || 'Not set'))
      }
      console.log('\nNo need to create again')
      process.exit(0)
    }

    // Check if there are existing admin users to upgrade
    const existingAdmins = await db.query('SELECT * FROM users WHERE role = ?', ['admin'])
    
    if (existingAdmins.length &gt; 0) {
      console.log('Found existing admin accounts, can upgrade to super admin:')
      for (let i = 0; i &lt; existingAdmins.length; i++) {
        const admin = existingAdmins[i]
        console.log('   ' + (i + 1) + '. ID: ' + admin.id + ', Nickname: ' + (admin.nickname || 'Not set') + ', Phone: ' + (admin.phone || 'Not set'))
      }
      
      // Upgrade first admin to super admin
      const adminToUpgrade = existingAdmins[0]
      await db.query('UPDATE users SET role = ? WHERE id = ?', ['super_admin', adminToUpgrade.id])
      
      console.log('\nSuccessfully upgraded the following account to super admin:')
      console.log('   - ID: ' + adminToUpgrade.id)
      console.log('   - Nickname: ' + (adminToUpgrade.nickname || 'Not set'))
      console.log('   - Phone: ' + (adminToUpgrade.phone || 'Not set'))
      process.exit(0)
    }

    // Create new super admin account
    console.log('No existing admin found, creating new super admin account...\n')
    
    const result = await db.query(
      'INSERT INTO users (nickname, role, status) VALUES (?, ?, ?)',
      ['Super Admin', 'super_admin', 1]
    )

    const newAdminId = result.insertId

    console.log('Super admin account created successfully!')
    console.log('\nAccount information:')
    console.log('   - User ID: ' + newAdminId)
    console.log('   - Nickname: Super Admin')
    console.log('   - Role: super_admin')
    console.log('   - Status: Enabled')
    console.log('\nUsage instructions:')
    console.log('   1. You can bind this account with a phone number or WeChat login')
    console.log('   2. After logging in, go to "My" page to see "Admin Dashboard" entry')
    console.log('   3. Only super admin can set/unset other users as admin in user management page')

    process.exit(0)
  } catch (err) {
    console.error('Failed to create super admin account:', err.message)
    process.exit(1)
  }
}

createSuperAdmin()

