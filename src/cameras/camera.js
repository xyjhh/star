import * as THREE from 'three'

// 创建相机
export const createCamera = renderer => {
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 2, 5) // 设置初始位置

  // 创建第一人称控制器

  return { camera }
}

// 更新相机尺寸
export const updateCamera = camera => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // 注意：控制器在动画循环中单独更新，这里不需要调用update
  // 因为update需要deltaTime参数，而这里我们没有
}

export default createCamera
