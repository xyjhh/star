import * as THREE from 'three'
// 处理窗口大小调整
export const handleResize = (camera, renderer, controls) => {
  // 更新相机
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  // 更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight)

  // 如果有控制器也需要更新
  if (controls) {
    controls.update()
  }
}

// 动画循环
export const animate = (scene, camera, renderer) => {
  const clock = new THREE.Clock()

  const render = () => {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
  }

  render()
}

export default { handleResize, animate }
