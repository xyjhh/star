import * as THREE from 'three'

// 创建WebGL渲染器
export const createRenderer = () => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })

  return renderer
}

// 更新渲染器尺寸
export const updateRenderer = renderer => {
  renderer.setSize(window.innerWidth, window.innerHeight)
}

export default createRenderer
