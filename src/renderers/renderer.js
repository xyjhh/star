import * as THREE from 'three/webgpu'

// 创建WebGPU渲染器
export const createRenderer = async () => {
  // 检查WebGPU支持

  try {
    const renderer = new THREE.WebGPURenderer({ antialias: true })
    await renderer.init()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x222222) // Dark gray background
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // 添加 tone mapping 设置，与 three 项目保持一致
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5

    console.log('WebGPU renderer initialized successfully')
    return renderer
  } catch (error) {
    console.warn('Failed to initialize WebGPU, falling back to WebGL:', error)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x222222)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    return renderer
  }
}

// 更新渲染器尺寸
export const updateRenderer = renderer => {
  renderer.setSize(window.innerWidth, window.innerHeight)
}

export default createRenderer
