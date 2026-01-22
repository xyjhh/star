import * as THREE from 'three'

// 资源管理器 - 统一管理纹理和模型加载
class ResourceManager {
  constructor() {
    this.textureLoader = new THREE.TextureLoader()
    this.loadedTextures = new Map()
    this.loadingPromises = new Map()
  }

  // 加载纹理，支持缓存
  async loadTexture(url) {
    if (this.loadedTextures.has(url)) {
      return this.loadedTextures.get(url)
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)
    }

    const promise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          this.loadedTextures.set(url, texture)
          resolve(texture)
        },
        undefined,
        error => {
          console.error(`Failed to load texture: ${url}`, error)
          reject(error)
        }
      )
    })

    this.loadingPromises.set(url, promise)
    return promise
  }

  // 批量加载纹理
  async loadTextures(urls) {
    const promises = urls.map(url => this.loadTexture(url))
    return Promise.all(promises)
  }

  // 配置纹理属性
  configureTexture(texture, config = {}) {
    const { wrapS = THREE.RepeatWrapping, wrapT = THREE.RepeatWrapping, repeat = [1, 1] } = config

    texture.wrapS = wrapS
    texture.wrapT = wrapT
    texture.repeat.set(...repeat)

    return texture
  }

  // 获取已加载的纹理
  getTexture(url) {
    return this.loadedTextures.get(url)
  }

  // 清理资源
  dispose() {
    this.loadedTextures.forEach(texture => {
      texture.dispose()
    })
    this.loadedTextures.clear()
    this.loadingPromises.clear()
  }
}

// 创建全局实例
export const resourceManager = new ResourceManager()

export default ResourceManager
