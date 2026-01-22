import { GUI } from 'lil-gui'
import Stats from 'stats.js'

export default class GUIView {
  constructor(app) {
    this.app = app

    this.particlesHitArea = false
    this.particlesRandom = 2
    this.particlesDepth = 4
    this.particlesSize = 1.5

    this.touchRadius = 0.15

    this.initGUI()
    // this.initStats();

    // this.disable();
  }

  initGUI() {
    this.gui = new GUI({ width: 300 })
    this.gui.hide()

    // Touch settings
    const touchFolder = this.gui.addFolder('Touch')
    touchFolder
      .add(this, 'touchRadius', 0, 0.5)
      .name('Radius')
      .onChange(this.onTouchChange.bind(this))

    // Particles settings
    const particlesFolder = this.gui.addFolder('Particles')
    particlesFolder
      .add(this, 'particlesRandom', 1, 10)
      .name('Random')
      .onChange(this.onParticlesChange.bind(this))
    particlesFolder
      .add(this, 'particlesDepth', 1, 10)
      .name('Depth')
      .onChange(this.onParticlesChange.bind(this))
    particlesFolder
      .add(this, 'particlesSize', 0, 3)
      .name('Size')
      .onChange(this.onParticlesChange.bind(this))
    // particlesFolder.add(this, 'particlesHitArea').name('Hit Area').onChange(this.onParticlesChange.bind(this))
  }

  initStats() {
    this.stats = new Stats()

    document.body.appendChild(this.stats.dom)
  }

  // ---------------------------------------------------------------------------------------------
  // PUBLIC
  // ---------------------------------------------------------------------------------------------

  update() {
    // draw touch texture
    if (this.touchCanvas) {
      if (!this.app.webgl) return
      if (!this.app.webgl.particles) return
      if (!this.app.webgl.particles.touch) return
      const source = this.app.webgl.particles.touch.canvas
      const x = Math.floor((this.touchCanvas.width - source.width) * 0.5)
      this.touchCtx.fillRect(0, 0, this.touchCanvas.width, this.touchCanvas.height)
      this.touchCtx.drawImage(source, x, 0)
    }
  }

  enable() {
    this.gui.show()
    if (this.stats) this.stats.dom.style.display = ''
  }

  disable() {
    this.gui.hide()
    if (this.stats) this.stats.dom.style.display = 'none'
  }

  toggle() {
    if (this.gui._hidden) this.enable()
    else this.disable()
  }

  onTouchChange() {
    if (!this.app.webgl) return
    if (!this.app.webgl.particles) return

    this.app.webgl.particles.touch.radius = this.touchRadius
  }

  onParticlesChange() {
    if (!this.app.webgl) return
    if (!this.app.webgl.particles) return

    this.app.webgl.particles.object3D.material.uniforms.uRandom.value = this.particlesRandom
    this.app.webgl.particles.object3D.material.uniforms.uDepth.value = this.particlesDepth
    this.app.webgl.particles.object3D.material.uniforms.uSize.value = this.particlesSize

    this.app.webgl.particles.hitArea.material.visible = this.particlesHitArea
  }

  onPostProcessingChange() {
    if (!this.app.webgl.composer) return
    this.app.webgl.composer.enabled = this.postProcessing
  }
}
