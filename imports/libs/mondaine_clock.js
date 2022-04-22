import { SVG } from '@svgdotjs/svg.js'

export class MondaineClock {
  constructor (target) {
    this.bounceTime = 0.5
    this.draw = SVG().addTo(target)
    this.setup()
  }
  async setup () {
    const response = await fetch('/img/mondaine_clock.svg')
    const mondaine_clock = await response.text()
    this.clock = this.draw.svg(mondaine_clock)
    this.second_hand = this.clock.findOne('#second_hand')
    this.minute_hand = this.clock.findOne('#minute_hand')
    this.hour_hand = this.clock.findOne('#hour_hand')
    this.bbox = this.clock.findOne('#clock_face').bbox()
    this.origin = [this.bbox.cx, this.bbox.cy]
    this.drawLoop()
  }
  drawLoop () {
    this.update()
    requestAnimationFrame(this.drawLoop.bind(this))
  }
  update () {
    var now = new Date()
    this.updateSecondHand(now.getSeconds() + now.getMilliseconds() / 1000.0)
    this.updateMinuteHand(
      now.getMinutes(),
      now.getSeconds() + now.getMilliseconds() / 1000.0
    )
    this.updateHourHand(
      now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
    )
  }
  updateSecondHand (seconds) {
    var rotation = Math.min(seconds / 59, 1.0) * 360.0
    this.second_hand.transform({ rotate: rotation, origin: this.origin })
  }
  updateMinuteHand (minutes, seconds) {
    var rotation

    if (seconds >= 0 && seconds < this.bounceTime) {
      rotation =
        ((-1 + this.elastic(seconds / this.bounceTime) + minutes) / 60.0) *
        360.0
    } else if (this.lastMinute !== minutes) {
      rotation = (minutes / 60.0) * 360.0
    }

    this.minute_hand.transform({ rotate: rotation, origin: this.origin })
  }
  updateHourHand (hours) {
    var rotation = (hours / 12.0) * 360.0
    this.hour_hand.transform({ rotate: rotation, origin: this.origin })
  }

  elastic (pos) {
    if (pos == !!pos) return pos
    return (
      Math.pow(2, -10 * pos) * Math.sin(((pos - 0.075) * (2 * Math.PI)) / 0.3) +
      1
    )
  }
}
