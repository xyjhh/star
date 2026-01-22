import * as THREE from 'three'
import { handleResize, animate } from '../utils/animations.js'
import createScene from '../scenes/scene.js'
import createCamera from '../cameras/camera.js'
import createRenderer from '../renderers/renderer.js'
import { CONFIG } from '../config/index.js'
import Particles from '../scripts/webgl/particles/Particles.js'
import InteractiveControls from '../scripts/webgl/controls/InteractiveControls.js'
import GUIView from '../scripts/gui/GUIView.js'

// 主应用类
export class App {
  constructor() {
    this.scene = null
    this.renderer = null
    this.camera = null
    this.clock = new THREE.Clock()
    this.isInitialized = false

    // 粒子系统相关
    this.particles = null
    this.interactive = null
    this.gui = null
    this.fovHeight = 0

    this.samples = [
      'images/sample-01.png',
      'images/sample-02.png',
      'images/sample-03.png',
      'images/sample-04.png',
      'images/sample-05.png',
    ]
  }

  // 初始化应用
  async init() {
    try {
      console.log('Initializing Three.js application...')

      // 创建核心组件
      this.scene = createScene()
      this.renderer = createRenderer()

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

      // 初始化粒子系统
      this.initParticles()
      this.initControls()
      this.initGUI()

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
      this.resize()
    })

    // 键盘事件
    window.addEventListener('keyup', this.keyup.bind(this))

    // 鼠标点击事件
    const el = this.renderer.domElement
    el.addEventListener('click', this.click.bind(this))

    // 清理函数
    window.addEventListener('beforeunload', () => {
      this.dispose()
    })
  }

  // 窗口大小调整处理
  resize() {
    handleResize(this.camera, this.renderer)
    this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z
    if (this.interactive) this.interactive.resize()
    if (this.particles) this.particles.resize()
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

      // 更新粒子系统和GUI
      this.update(deltaTime)

      // 渲染场景
      this.draw()
    }

    render()
  }

  // 更新逻辑
  update(deltaTime) {
    if (this.particles) this.particles.update(deltaTime)
    if (this.gui) this.gui.update()
  }

  // 绘制逻辑
  draw() {
    this.renderer.render(this.scene, this.camera)
  }

  // 初始化粒子系统
  initParticles() {
    this.particles = new Particles(this)
    this.scene.add(this.particles.container)

    const rnd = ~~(Math.random() * this.samples.length)
    this.goto(rnd)
  }

  // 初始化交互控制
  initControls() {
    this.interactive = new InteractiveControls(this.camera, this.renderer.domElement)
  }

  // 初始化GUI
  initGUI() {
    this.gui = new GUIView(this)
  }

  // 粒子系统控制方法
  goto(index) {
    // init next
    if (this.currSample == null) this.particles.init(this.samples[index])
    // hide curr then init next
    else {
      this.particles.hide(true).then(() => {
        this.particles.init(this.samples[index])
      })
    }

    this.currSample = index
  }

  next() {
    if (this.currSample < this.samples.length - 1) this.goto(this.currSample + 1)
    else this.goto(0)
  }

  // 事件处理
  keyup(e) {
    // g
    if (e.keyCode == 71) {
      if (this.gui) this.gui.toggle()
    }
  }

  click(e) {
    this.next()
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
