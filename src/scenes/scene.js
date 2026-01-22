import * as THREE from 'three'
import { CONFIG } from '../config/index.js'

// 创建场景
export const createScene = () => {
  const scene = new THREE.Scene()

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(
    CONFIG.scene.ambientLight.color,
    CONFIG.scene.ambientLight.intensity
  )
  scene.add(ambientLight)

  return scene
}

export default createScene
