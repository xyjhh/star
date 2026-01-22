import { app } from './core/App.js'

// 启动应用
async function startApp() {
  try {
    await app.init()
  } catch (error) {
    console.error('Failed to start application:', error)
    // 可以在这里显示错误UI或重试逻辑
  }
}

// 当DOM加载完成后启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp)
} else {
  startApp()
}
