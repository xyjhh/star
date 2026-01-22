const express = require('express')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

// 启用 CORS
app.use(cors())

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'dist')))

// 处理所有路由，返回 index.html（用于 SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Visit: http://localhost:${PORT}`)
})
