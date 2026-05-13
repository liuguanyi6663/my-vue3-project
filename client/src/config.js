// API 服务端地址，通过 VITE_API_BASE_URL 环境变量配置
// 复制 .env.example 为 .env 后修改 VITE_API_BASE_URL 为你的服务器地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

export default API_BASE_URL
