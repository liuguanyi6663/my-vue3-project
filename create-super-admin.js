
const db = require('./server/utils/db')
const crypto = require('crypto')

function generateRandomPassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length).replace(/[+/=]/g, 'x')
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function createSuperAdmin() {
  console.log('Starting to create super admin account...\n')
  
  try {
    const generatedPassword = generateRandomPassword(12)
    const hashedPassword = hashPassword(generatedPassword)

    const existingSuperAdmins = await db.query('SELECT * FROM users WHERE role = ?', ['super_admin'])
    
    if (existingSuperAdmins.length > 0) {
      console.log('Super admin account already exists:')
      for (let i = 0; i < existingSuperAdmins.length; i++) {
        const admin = existingSuperAdmins[i]
        console.log('   - ID: ' + admin.id + ', Username: ' + (admin.username || 'Not set') + ', Nickname: ' + (admin.nickname || 'Not set') + ', Phone: ' + (admin.phone || 'Not set'))
        if (!admin.username || !admin.password) {
          await db.query(
            'UPDATE users SET username = ?, password = ? WHERE id = ?',
            [admin.username || 'admin', admin.password || hashedPassword, admin.id]
          )
          console.log('   - (Updated: set username/password for existing super admin)')
        }
      }
      console.log('\nNo need to create again')
      process.exit(0)
    }

    const existingAdmins = await db.query('SELECT * FROM users WHERE role = ?', ['admin'])
    
    if (existingAdmins.length > 0) {
      console.log('Found existing admin accounts, can upgrade to super admin:')
      for (let i = 0; i < existingAdmins.length; i++) {
        const admin = existingAdmins[i]
        console.log('   ' + (i + 1) + '. ID: ' + admin.id + ', Username: ' + (admin.username || 'Not set') + ', Nickname: ' + (admin.nickname || 'Not set') + ', Phone: ' + (admin.phone || 'Not set'))
      }
      
      const adminToUpgrade = existingAdmins[0]
      await db.query(
        'UPDATE users SET role = ?, username = COALESCE(username, ?), password = COALESCE(password, ?) WHERE id = ?',
        ['super_admin', 'admin', hashedPassword, adminToUpgrade.id]
      )
      
      console.log('\nSuccessfully upgraded the following account to super admin:')
      console.log('   - ID: ' + adminToUpgrade.id)
      console.log('   - Username: ' + (adminToUpgrade.username || 'admin'))
      console.log('   - Nickname: ' + (adminToUpgrade.nickname || 'Not set'))
      console.log('   - Phone: ' + (adminToUpgrade.phone || 'Not set'))
      if (!adminToUpgrade.password) {
        console.log('   - Password: ' + generatedPassword + ' (PLEASE CHANGE AFTER LOGIN)')
      }
      process.exit(0)
    }

    console.log('No existing admin found, creating new super admin account...\n')
    
    const result = await db.query(
      'INSERT INTO users (username, password, nickname, role, status) VALUES (?, ?, ?, ?, ?)',
      ['admin', hashedPassword, 'Super Admin', 'super_admin', 1]
    )

    const newAdminId = result.insertId

    console.log('Super admin account created successfully!')
    console.log('\nAccount information:')
    console.log('   - User ID: ' + newAdminId)
    console.log('   - Username: admin')
    console.log('   - Password: ' + generatedPassword + ' (PLEASE CHANGE AFTER LOGIN)')
    console.log('   - Nickname: Super Admin')
    console.log('   - Role: super_admin')
    console.log('   - Status: Enabled')
    console.log('\nUsage instructions:')
    console.log('   1. Login via API: POST /api/user/login with { "username": "admin", "password": "' + generatedPassword + '" }')
    console.log('   2. Or bind this account with a phone number or WeChat login after initial login')
    console.log('   3. After logging in, go to "My" page to see "Admin Dashboard" entry')
    console.log('   4. Only super admin can set/unset other users as admin in user management page')

    process.exit(0)
  } catch (err) {
    console.error('Failed to create super admin account:', err.message)
    process.exit(1)
  }
}

createSuperAdmin()

