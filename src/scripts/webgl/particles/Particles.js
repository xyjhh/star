import * as THREE from 'three'
import { gsap } from 'gsap'

import TouchTexture from './TouchTexture'
import vertexShader from '../../../shaders/particle.vert?raw'
import fragmentShader from '../../../shaders/particle.frag?raw'

export default class Particles {
  constructor(webgl) {
    this.webgl = webgl
    this.container = new THREE.Object3D()
  }

  init(src) {
    const loader = new THREE.TextureLoader()

    loader.load(src, texture => {
      this.texture = texture
      this.texture.minFilter = THREE.LinearFilter
      this.texture.magFilter = THREE.LinearFilter
      // this.texture.format = THREE.RGBFormat // Removed in newer Three.js versions

      this.width = texture.image.width
      this.height = texture.image.height

      this.initPoints(true)
      this.initHitArea()
      this.initTouch()
      this.resize()
      this.show()
    })
  }

  initPoints(discard) {
    this.numPoints = this.width * this.height

    let numVisible = this.numPoints
    let threshold = 0
    let originalColors

    if (discard) {
      // 自适应粒子密度：根据设备性能调整阈值
      numVisible = 0
      threshold = this.calculateAdaptiveThreshold()

      const img = this.texture.image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = this.width
      canvas.height = this.height
      ctx.scale(1, -1)
      ctx.drawImage(img, 0, 0, this.width, this.height * -1)

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      originalColors = Float32Array.from(imgData.data)

      for (let i = 0; i < this.numPoints; i++) {
        if (originalColors[i * 4 + 0] > threshold) numVisible++
      }

      console.log(
        `粒子统计: 总像素 ${this.numPoints}, 显示粒子 ${numVisible}, 过滤阈值 ${threshold}`
      )
    }

    const uniforms = {
      uTime: { value: 0 },
      uRandom: { value: 1.0 },
      uDepth: { value: 2.0 },
      uSize: { value: 0.0 },
      uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
      uTexture: { value: this.texture },
      uTouch: { value: null },
    }

    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      depthTest: false,
      transparent: true,
      // blending: THREE.AdditiveBlending
    })

    const geometry = new THREE.InstancedBufferGeometry()

    // positions
    const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3)
    positions.setXYZ(0, -0.5, 0.5, 0.0)
    positions.setXYZ(1, 0.5, 0.5, 0.0)
    positions.setXYZ(2, -0.5, -0.5, 0.0)
    positions.setXYZ(3, 0.5, -0.5, 0.0)
    geometry.setAttribute('position', positions)

    // uvs
    const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2)
    uvs.setXYZ(0, 0.0, 0.0)
    uvs.setXYZ(1, 1.0, 0.0)
    uvs.setXYZ(2, 0.0, 1.0)
    uvs.setXYZ(3, 1.0, 1.0)
    geometry.setAttribute('uv', uvs)

    // index
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1))

    const indices = new Uint16Array(numVisible)
    const offsets = new Float32Array(numVisible * 3)
    const angles = new Float32Array(numVisible)

    for (let i = 0, j = 0; i < this.numPoints; i++) {
      if (discard && originalColors[i * 4 + 0] <= threshold) continue

      offsets[j * 3 + 0] = i % this.width
      offsets[j * 3 + 1] = Math.floor(i / this.width)

      indices[j] = i

      angles[j] = Math.random() * Math.PI

      j++
    }

    geometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false))
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false))
    geometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false))

    this.object3D = new THREE.Mesh(geometry, material)
    this.container.add(this.object3D)
  }

  initTouch() {
    // create only once
    if (!this.touch) this.touch = new TouchTexture(this)
    this.object3D.material.uniforms.uTouch.value = this.touch.texture
  }

  initHitArea() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      depthTest: false,
    })
    material.visible = false
    this.hitArea = new THREE.Mesh(geometry, material)
    this.container.add(this.hitArea)
  }

  addListeners() {
    this.handlerInteractiveMove = this.onInteractiveMove.bind(this)

    this.webgl.interactive.addListener('interactive-move', this.handlerInteractiveMove)
    this.webgl.interactive.objects.push(this.hitArea)
    this.webgl.interactive.enable()
  }

  removeListeners() {
    this.webgl.interactive.removeListener('interactive-move', this.handlerInteractiveMove)

    const index = this.webgl.interactive.objects.findIndex(obj => obj === this.hitArea)
    this.webgl.interactive.objects.splice(index, 1)
    this.webgl.interactive.disable()
  }

  // ---------------------------------------------------------------------------------------------
  // PUBLIC
  // ---------------------------------------------------------------------------------------------

  update(delta) {
    if (!this.object3D) return
    if (this.touch) this.touch.update()

    this.object3D.material.uniforms.uTime.value += delta
  }

  show(time = 1.0) {
    // reset
    gsap.fromTo(
      this.object3D.material.uniforms.uSize,
      { value: 0.5 },
      { value: 1.5, duration: time }
    )
    gsap.to(this.object3D.material.uniforms.uRandom, { value: 2.0, duration: time })
    gsap.fromTo(
      this.object3D.material.uniforms.uDepth,
      { value: 40.0 },
      { value: 4.0, duration: time * 1.5 }
    )

    this.addListeners()
  }

  hide(_destroy, time = 0.8) {
    return new Promise((resolve, reject) => {
      gsap.to(this.object3D.material.uniforms.uRandom, {
        value: 5.0,
        duration: time,
        onComplete: () => {
          if (_destroy) this.destroy()
          resolve()
        },
      })
      gsap.to(this.object3D.material.uniforms.uDepth, {
        value: -20.0,
        duration: time,
        ease: 'power2.in',
      })
      gsap.to(this.object3D.material.uniforms.uSize, {
        value: 0.0,
        duration: time * 0.8,
      })

      this.removeListeners()
    })
  }

  destroy() {
    if (!this.object3D) return

    this.object3D.parent.remove(this.object3D)
    this.object3D.geometry.dispose()
    this.object3D.material.dispose()
    this.object3D = null

    if (!this.hitArea) return

    this.hitArea.parent.remove(this.hitArea)
    this.hitArea.geometry.dispose()
    this.hitArea.material.dispose()
    this.hitArea = null
  }

  // ---------------------------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------------------------

  resize() {
    if (!this.object3D) return

    const scale = this.webgl.fovHeight / this.height
    this.object3D.scale.set(scale, scale, 1)
    this.hitArea.scale.set(scale, scale, 1)
  }

  onInteractiveMove(e) {
    const uv = e.intersectionData.uv
    if (this.touch) this.touch.addTouch(uv)
  }

  // ---------------------------------------------------------------------------------------------
  // PERFORMANCE OPTIMIZATION
  // ---------------------------------------------------------------------------------------------

  /**
   * 根据设备性能自适应调整粒子密度阈值
   * 返回值越低，粒子数量越多；返回值越高，粒子数量越少
   */
  calculateAdaptiveThreshold() {
    // 基础阈值
    let baseThreshold = 34

    // 检测设备性能
    const performance = this.detectDevicePerformance()

    // 根据性能等级调整阈值
    switch (performance.level) {
      case 'low':
        // 低性能设备：提高阈值，减少粒子数量
        baseThreshold = Math.max(80, baseThreshold + 30)
        break
      case 'medium':
        // 中等性能：稍微提高阈值
        baseThreshold = Math.max(50, baseThreshold + 15)
        break
      case 'high':
        // 高性能设备：保持较低阈值，显示更多粒子
        baseThreshold = Math.max(20, baseThreshold - 10)
        break
      default:
        baseThreshold = 34
    }

    console.log(`设备性能等级: ${performance.level}, 粒子阈值: ${baseThreshold}`)
    return baseThreshold
  }

  /**
   * 检测设备性能等级
   */
  detectDevicePerformance() {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) {
      return { level: 'low', reason: 'WebGL not supported' }
    }

    // 获取GPU信息
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''

    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    // 检测是否为低性能GPU
    const isLowEndGPU = /Intel.*HD|Intel.*UHD|Mesa|SwiftShader/i.test(renderer)

    // 检测内存大小（如果可用）
    const deviceMemory = navigator.deviceMemory || 4 // 默认4GB

    // 性能评分
    let score = 0

    if (!isMobile) score += 2 // 桌面设备加分
    if (!isLowEndGPU) score += 2 // 高性能GPU加分
    if (deviceMemory >= 8) score += 1 // 大内存加分

    // 根据分数确定等级
    let level = 'medium'
    if (score <= 1) level = 'low'
    else if (score >= 4) level = 'high'

    return {
      level,
      score,
      renderer,
      isMobile,
      deviceMemory,
      reason: `Score: ${score}, Mobile: ${isMobile}, GPU: ${renderer.substring(0, 30)}...`,
    }
  }
}
