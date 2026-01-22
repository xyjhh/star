import * as THREE from 'three'
import { handleResize, animate } from '../utils/animations.js'
import createScene from '../scenes/scene.js'
import createCamera from '../cameras/camera.js'
import createRenderer from '../renderers/renderer.js'
import { CONFIG } from '../config/index.js'

// 主应用类
export class App {
  constructor() {
    this.scene = null
    this.renderer = null
    this.camera = null
    this.clock = new THREE.Clock()
    this.isInitialized = false
  }

  // 初始化应用
  async init() {
    try {
      console.log('Initializing Three.js application...')

      // 创建核心组件
      this.scene = createScene()
      this.renderer = await createRenderer()

      // 阴影设置已在sky.js的updateSky函数中处理

      // 创建相机和控制器
      const { camera } = createCamera(this.renderer)
      this.camera = camera

      // 将渲染器添加到DOM
      const container = document.getElementById(CONFIG.app.containerId)
      if (!container) {
        throw new Error(`Container element with id '${CONFIG.app.containerId}' not found`)
      }
      container.appendChild(this.renderer.domElement)

      // 设置事件监听器
      this.setupEventListeners()

      // 启动动画循环
      this.startAnimationLoop()

      this.isInitialized = true
      console.log('Application initialized successfully')
    } catch (error) {
      console.error('Failed to initialize application:', error)
      throw error
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    // 窗口大小调整
    window.addEventListener('resize', () => {
      handleResize(this.camera, this.renderer)
    })

    // 清理函数
    window.addEventListener('beforeunload', () => {
      this.dispose()
    })
  }

  // 清理资源
  dispose() {
    if (this.renderer) {
      this.renderer.dispose()
    }
    if (this.scene) {
      this.scene.traverse(object => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  }

  // 启动动画循环
  startAnimationLoop() {
    const render = () => {
      requestAnimationFrame(render)

      const deltaTime = this.clock.getDelta()

      // 渲染场景
      this.renderer.render(this.scene, this.camera)
    }

    render()
  }

  // 获取应用状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasScene: !!this.scene,
      hasRenderer: !!this.renderer,
      hasCamera: !!this.camera,
    }
  }
}

// 创建应用实例
export const app = new App()

export default App
