const mysql = require('mysql2/promise')
const config = require('../config/index')

const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

module.exports = {
  query: async (sql, params) => {
    console.log('执行SQL:', sql, params)
    const [rows] = await pool.query(sql, params || [])
    return rows
  },
  getConnection: async () => {
    return await pool.getConnection()
  }
}
