#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const db = require('../utils/db')
const config = require('../config/index')

const BACKUP_DIR = path.join(__dirname, '../backups')

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

const generateBackupFilename = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10)
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '-')
  return `kaoyan_db_${dateStr}_${timeStr}.sql`
}

const backupDatabase = async () => {
  const filename = generateBackupFilename()
  const filepath = path.join(BACKUP_DIR, filename)

  console.log('📦 开始备份数据库...')

  const { mysql } = config
  const command = `mysqldump -u ${mysql.user} --password=${mysql.password} --host=${mysql.host} --port=${mysql.port} --databases ${mysql.database} > "${filepath}"`

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 备份失败:', error.message)
        reject(error)
        return
      }
      const stats = fs.statSync(filepath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      console.log(`✅ 备份完成: ${filename} (${sizeMB} MB)`)
      cleanupOldBackups()
      resolve(filepath)
    })
  })
}

const cleanupOldBackups = () => {
  console.log('🧹 清理旧备份文件...')
  const files = fs.readdirSync(BACKUP_DIR)
  const backups = files.filter(f => f.endsWith('.sql')).sort()
  const keepCount = 14

  if (backups.length > keepCount) {
    const toDelete = backups.slice(0, backups.length - keepCount)
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f))
      console.log(`🗑️  删除旧备份: ${f}`)
    })
  }
}

const listBackups = () => {
  const files = fs.readdirSync(BACKUP_DIR)
  const backups = files.filter(f => f.endsWith('.sql')).sort().reverse()
  console.log('\n📋 现有备份文件:')
  backups.forEach(f => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f))
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    const mtime = new Date(stats.mtime).toLocaleString()
    console.log(`  - ${f} (${sizeMB} MB, ${mtime})`)
  })
  console.log()
}

const main = async () => {
  try {
    const args = process.argv.slice(2)
    if (args.includes('--list')) {
      listBackups()
    } else {
      await backupDatabase()
      listBackups()
    }
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  backupDatabase,
  listBackups,
  BACKUP_DIR
}
