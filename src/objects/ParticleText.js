import * as THREE from 'three'

// 粒子文字基类
export class ParticleText {
  constructor(scene, text = 'HELLO', options = {}) {
    this.scene = scene
    this.text = text
    this.options = {
      fontSize: 2,
      particleCount: 1000,
      particleSize: 0.02,
      color: 0x00ffff,
      ...options,
    }

    this.particles = null
    this.geometry = null
    this.material = null
    this.mesh = null
    this.isInitialized = false
  }

  async init() {
    // 子类实现具体的初始化逻辑
    this.isInitialized = true
  }

  update(deltaTime) {
    // 子类实现动画更新逻辑
  }

  dispose() {
    if (this.geometry) this.geometry.dispose()
    if (this.material) this.material.dispose()
    if (this.mesh && this.scene) {
      this.scene.remove(this.mesh)
    }
  }
}

// 方案一：流动粒子文字
export class FlowingParticleText extends ParticleText {
  constructor(scene, text, options) {
    super(scene, text, options)
    this.flowSpeed = options.flowSpeed || 1.0
    this.time = 0
  }

  async init() {
    // 创建文字几何体
    const fontLoader = new THREE.FontLoader()
    const font = await new Promise((resolve, reject) => {
      fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        resolve,
        undefined,
        reject
      )
    })

    const textGeometry = new THREE.TextGeometry(this.text, {
      font: font,
      size: this.options.fontSize,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    })

    // 从文字几何体提取轮廓点
    const positions = []
    const tempGeometry = textGeometry.clone()
    tempGeometry.computeBoundingBox()

    // 简化版：创建基于文字的粒子位置
    for (let i = 0; i < this.options.particleCount; i++) {
      const x = (Math.random() - 0.5) * this.options.fontSize * 4
      const y = (Math.random() - 0.5) * this.options.fontSize * 2
      const z = 0

      // 只保留在文字边界内的粒子（简化判断）
      positions.push(x, y, z)
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    // 自定义 Shader
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.options.color) },
        size: { value: this.options.particleSize },
      },
      vertexShader: `
        uniform float time;
        uniform float size;

        void main() {
          vec3 pos = position;

          // 流动效果
          pos.x += sin(time * 2.0 + pos.y * 0.5) * 0.1;
          pos.y += cos(time * 1.5 + pos.x * 0.3) * 0.05;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;

        void main() {
          float alpha = 1.0 - length(gl_PointCoord - vec2(0.5));
          gl_FragColor = vec4(color, alpha * alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)

    await super.init()
  }

  update(deltaTime) {
    if (!this.isInitialized) return

    this.time += deltaTime * this.flowSpeed
    this.material.uniforms.time.value = this.time
  }
}

// 方案二：爆炸粒子文字
export class ExplodingParticleText extends ParticleText {
  constructor(scene, text, options) {
    super(scene, text, options)
    this.explosionProgress = 0
    this.isExploding = false
    this.originalPositions = []
  }

  async init() {
    const fontLoader = new THREE.FontLoader()
    const font = await new Promise((resolve, reject) => {
      fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        resolve,
        reject
      )
    })

    const textGeometry = new THREE.TextGeometry(this.text, {
      font: font,
      size: this.options.fontSize,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    })

    const positions = []
    for (let i = 0; i < this.options.particleCount; i++) {
      const x = (Math.random() - 0.5) * this.options.fontSize * 4
      const y = (Math.random() - 0.5) * this.options.fontSize * 2
      const z = 0

      positions.push(x, y, z)
      this.originalPositions.push(x, y, z)
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute(
      'originalPosition',
      new THREE.Float32BufferAttribute(this.originalPositions, 3)
    )

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        explosionProgress: { value: 0 },
        color: { value: new THREE.Color(this.options.color) },
        size: { value: this.options.particleSize },
      },
      vertexShader: `
        uniform float explosionProgress;
        attribute vec3 originalPosition;

        void main() {
          vec3 pos = mix(originalPosition, originalPosition * (1.0 + explosionProgress * 3.0), explosionProgress);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 - explosionProgress * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float explosionProgress;

        void main() {
          float alpha = 1.0 - length(gl_PointCoord - vec2(0.5));
          alpha *= (1.0 - explosionProgress);
          gl_FragColor = vec4(color, alpha * alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)

    await super.init()
  }

  explode() {
    this.isExploding = true
    this.explosionProgress = 0
  }

  update(deltaTime) {
    if (!this.isInitialized) return

    if (this.isExploding) {
      this.explosionProgress += deltaTime * 2
      if (this.explosionProgress >= 1) {
        this.explosionProgress = 1
        this.isExploding = false
        // 重置到原始位置
        setTimeout(() => {
          this.explosionProgress = 0
          this.material.uniforms.explosionProgress.value = 0
        }, 1000)
      }
    }

    this.material.uniforms.explosionProgress.value = this.explosionProgress
  }
}

// 方案三：波浪粒子文字
export class WaveParticleText extends ParticleText {
  constructor(scene, text, options) {
    super(scene, text, options)
    this.waveFrequency = options.waveFrequency || 1.0
    this.waveAmplitude = options.waveAmplitude || 0.2
    this.time = 0
  }

  async init() {
    const fontLoader = new THREE.FontLoader()
    const font = await new Promise((resolve, reject) => {
      fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        resolve,
        reject
      )
    })

    const textGeometry = new THREE.TextGeometry(this.text, {
      font: font,
      size: this.options.fontSize,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    })

    const positions = []
    const colors = []

    for (let i = 0; i < this.options.particleCount; i++) {
      const x = (Math.random() - 0.5) * this.options.fontSize * 4
      const y = (Math.random() - 0.5) * this.options.fontSize * 2
      const z = 0

      positions.push(x, y, z)

      // 根据位置设置颜色渐变
      const color = new THREE.Color()
      color.setHSL(0.6 + y * 0.1, 0.8, 0.6)
      colors.push(color.r, color.g, color.b)
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waveFrequency: { value: this.waveFrequency },
        waveAmplitude: { value: this.waveAmplitude },
      },
      vertexShader: `
        uniform float time;
        uniform float waveFrequency;
        uniform float waveAmplitude;
        attribute vec3 color;

        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = position;

          // 波浪效果
          pos.z += sin(time * waveFrequency + pos.x * 0.5) * waveAmplitude;
          pos.y += cos(time * waveFrequency * 0.7 + pos.x * 0.3) * waveAmplitude * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float alpha = 1.0 - length(gl_PointCoord - vec2(0.5));
          gl_FragColor = vec4(vColor, alpha * alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)

    await super.init()
  }

  update(deltaTime) {
    if (!this.isInitialized) return

    this.time += deltaTime
    this.material.uniforms.time.value = this.time
  }
}

// 方案四：螺旋粒子文字
export class SpiralParticleText extends ParticleText {
  constructor(scene, text, options) {
    super(scene, text, options)
    this.spiralSpeed = options.spiralSpeed || 1.0
    this.spiralHeight = options.spiralHeight || 2.0
    this.time = 0
  }

  async init() {
    const fontLoader = new THREE.FontLoader()
    const font = await new Promise((resolve, reject) => {
      fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        resolve,
        reject
      )
    })

    const textGeometry = new THREE.TextGeometry(this.text, {
      font: font,
      size: this.options.fontSize,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    })

    const positions = []
    const angles = []

    for (let i = 0; i < this.options.particleCount; i++) {
      const angle = (i / this.options.particleCount) * Math.PI * 4 // 两圈螺旋
      const radius = 0.5 + (i / this.options.particleCount) * 1.5
      const height = (i / this.options.particleCount) * this.spiralHeight

      const x = Math.cos(angle) * radius
      const y = height - this.spiralHeight / 2
      const z = Math.sin(angle) * radius

      positions.push(x, y, z)
      angles.push(angle)
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1))

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        spiralSpeed: { value: this.spiralSpeed },
        color: { value: new THREE.Color(this.options.color) },
      },
      vertexShader: `
        uniform float time;
        uniform float spiralSpeed;
        attribute float angle;

        void main() {
          vec3 pos = position;

          // 螺旋上升动画
          float spiralOffset = mod(time * spiralSpeed + angle, 6.28);
          pos.y += sin(spiralOffset) * 0.2;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 4.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;

        void main() {
          float alpha = 1.0 - length(gl_PointCoord - vec2(0.5));
          float sparkle = sin(gl_PointCoord.x * 20.0) * sin(gl_PointCoord.y * 20.0);
          alpha += sparkle * 0.3;
          gl_FragColor = vec4(color, alpha * alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)

    await super.init()
  }

  update(deltaTime) {
    if (!this.isInitialized) return

    this.time += deltaTime
    this.material.uniforms.time.value = this.time
  }
}

// 方案五：磁场粒子文字
export class MagneticParticleText extends ParticleText {
  constructor(scene, text, options) {
    super(scene, text, options)
    this.magneticForce = options.magneticForce || 1.0
    this.mousePosition = new THREE.Vector3()
    this.targetPositions = []
  }

  async init() {
    const fontLoader = new THREE.FontLoader()
    const font = await new Promise((resolve, reject) => {
      fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        resolve,
        reject
      )
    })

    const textGeometry = new THREE.TextGeometry(this.text, {
      font: font,
      size: this.options.fontSize,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
    })

    const positions = []
    const velocities = []

    // 创建文字形状的目标位置
    for (let i = 0; i < this.options.particleCount; i++) {
      const x = (Math.random() - 0.5) * this.options.fontSize * 4
      const y = (Math.random() - 0.5) * this.options.fontSize * 2
      const z = 0

      this.targetPositions.push(x, y, z)
      positions.push(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        z + (Math.random() - 0.5) * 2
      )
      velocities.push(0, 0, 0)
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3))
    this.geometry.setAttribute(
      'targetPosition',
      new THREE.Float32BufferAttribute(this.targetPositions, 3)
    )

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        mousePosition: { value: new THREE.Vector3() },
        magneticForce: { value: this.magneticForce },
        color: { value: new THREE.Color(this.options.color) },
      },
      vertexShader: `
        uniform vec3 mousePosition;
        uniform float magneticForce;
        attribute vec3 velocity;
        attribute vec3 targetPosition;

        varying float distanceToMouse;

        void main() {
          vec3 pos = position;
          distanceToMouse = length(pos - mousePosition);

          // 磁场力计算
          vec3 force = normalize(mousePosition - pos) * magneticForce / (distanceToMouse * distanceToMouse + 1.0);
          pos += force * 0.01;

          // 向目标位置的引力
          vec3 toTarget = targetPosition - pos;
          pos += toTarget * 0.02;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float distanceToMouse;

        void main() {
          float alpha = 1.0 - length(gl_PointCoord - vec2(0.5));
          // 鼠标附近的粒子更亮
          alpha *= (1.0 + 0.5 / (distanceToMouse + 1.0));
          gl_FragColor = vec4(color, alpha * alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)

    // 添加鼠标事件监听
    this.addMouseListener()

    await super.init()
  }

  addMouseListener() {
    const onMouseMove = event => {
      const rect = event.target.getBoundingClientRect()
      this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      this.mousePosition.z = 0

      this.material.uniforms.mousePosition.value.copy(this.mousePosition)
    }

    window.addEventListener('mousemove', onMouseMove)
  }

  update(deltaTime) {
    if (!this.isInitialized) return

    // 更新粒子位置
    const positions = this.geometry.attributes.position.array
    const velocities = this.geometry.attributes.velocity.array
    const targets = this.geometry.attributes.targetPosition.array

    for (let i = 0; i < positions.length; i += 3) {
      const pos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])
      const target = new THREE.Vector3(targets[i], targets[i + 1], targets[i + 2])

      // 计算到鼠标的力
      const toMouse = this.mousePosition.clone().sub(pos)
      const mouseForce = toMouse
        .normalize()
        .multiplyScalar(this.magneticForce / (toMouse.lengthSq() + 1))

      // 计算到目标的力
      const toTarget = target.clone().sub(pos)
      const targetForce = toTarget.multiplyScalar(0.02)

      // 应用力
      velocities[i] += mouseForce.x + targetForce.x
      velocities[i + 1] += mouseForce.y + targetForce.y
      velocities[i + 2] += mouseForce.z + targetForce.z

      // 阻尼
      velocities[i] *= 0.98
      velocities[i + 1] *= 0.98
      velocities[i + 2] *= 0.98

      // 更新位置
      positions[i] += velocities[i] * deltaTime
      positions[i + 1] += velocities[i + 1] * deltaTime
      positions[i + 2] += velocities[i + 2] * deltaTime
    }

    this.geometry.attributes.position.needsUpdate = true
  }
}

// 导出所有方案
export {
  FlowingParticleText,
  ExplodingParticleText,
  WaveParticleText,
  SpiralParticleText,
  MagneticParticleText,
}

// 使用示例：
// import { FlowingParticleText } from './ParticleText.js'
// const textEffect = new FlowingParticleText(scene, 'HELLO')
// await textEffect.init()
// 在动画循环中调用 textEffect.update(deltaTime)
