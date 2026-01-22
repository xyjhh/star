// 应用配置文件

export const CONFIG = {
  // 应用基本配置
  app: {
    containerId: 'container',
    title: 'Three.js Scene',
  },

  // 场景配置
  scene: {
    ambientLight: {
      color: 0xffc080,
      intensity: 0.4, // 增加环境光强度，与半球光形成更好的照明平衡
    },
  },

  // 相机配置
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 5, y: 3, z: 5 },
  },

  // 控制器配置
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    screenSpacePanning: false,
    minDistance: 2,
    maxDistance: 2000,
  },

  // 渲染器配置
  renderer: {
    antialias: true,
    shadowMap: {
      enabled: true,
      type: 'PCFSoftShadowMap',
    },
    clearColor: 0x222222,
  },
}

export default CONFIG
