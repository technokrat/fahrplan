import { SVG } from '@svgdotjs/svg.js'

const train_name = 'train'
const s_bahn_name = 's_bahn'
const tram_name = 'tram'
const bus_name = 'bus'
const ship_name = 'ship'

const minVisibleCountdown = 10
const maxVisibleCountdown = 60
const maxVisibleCountdownPosition = 0.2
const zeroCountdownPosition = 0.8

export class ConnectionBoard {
  constructor (target, resizeCallback) {
    this.target = target
    this.resizeCallback = resizeCallback

    this.scale = 0.8
    this.horizontalOffset = 0
    this.lastTimestamp = 0
    this.maxCountdown = minVisibleCountdown
    this.connectionItems = {}

    this.updateSizing()
    this.draw = SVG().addTo(target)

    this.zeroMinuteLine = this.draw.line(-500, 0, -500, this.height).attr({
      id: 'zero-minutes',
      stroke: 'crimson',
      style: 'stroke-width: 5px; mix-blend-mode: screen; stroke-dasharray: 2;'
    })

    this.tenMinuteLine = this.draw.line(-500, 0, -500, this.height).attr({
      id: 'ten-minutes',
      stroke: 'SlateGrey ',
      style: 'stroke-width: 3px; mix-blend-mode: screen; stroke-dasharray: 2;'
    })

    this.initVehicleSymbols().then(() => {
      requestAnimationFrame(this.drawLoop.bind(this))
    })

    $(target).on('connectionBoard.resize', this.resize.bind(this))

    this.resizeCallback(this.trackCount)
  }
  async initVehicleSymbols () {
    await Promise.all([
      this.loadVehicleSymbol(train_name),
      this.loadVehicleSymbol(s_bahn_name),
      this.loadVehicleSymbol(tram_name),
      this.loadVehicleSymbol(bus_name),
      this.loadVehicleSymbol(ship_name)
    ])
  }

  async loadVehicleSymbol (name) {
    const response = await fetch(`/img/${name}.svg`)
    const content = await response.text()
    let svg = SVG().svg(content)
    let path = svg.findOne('g')
    path.attr('id', name)
    this.draw.defs().add(path)
  }

  resize () {
    this.updateSizing()
    this.updateConnections(this.connections, true)
    this.resizeCallback(this.trackCount)
  }

  destroy () {
    this.draw.clear()
  }

  updateSizing () {
    this.height = this.target.getBoundingClientRect().height
    this.trackHeight = 100 * this.scale
    this.trackWidth = this.target.getBoundingClientRect().width
    this.trackCount = Math.floor(this.height / this.trackHeight)
    this.trackCenterOffset = (this.height % this.trackHeight) / 2
  }

  calculateXPosition (countdown) {
    let normalized = countdown / this.maxCountdown
    //let offset = Math.pow(normalized, 1 / 3)
    let offset = normalized;

    let xPosition =
      this.trackWidth *
      (zeroCountdownPosition -
        offset * (zeroCountdownPosition - maxVisibleCountdownPosition))
    return xPosition
  }

  updateConnections (connections, isImmediateDismissal) {
    this.connections = connections
    let fetchedConnections = connections.fetch()
    if (fetchedConnections.length) {
      this.maxCountdown = Math.max(
        Math.min(
          fetchedConnections[
            Math.min(fetchedConnections.length - 1, this.trackCount - 1)
          ].countdown,
          maxVisibleCountdown
        ),
        minVisibleCountdown
      )
    } else {
      this.maxCountdown = minVisibleCountdown
    }

    let updatedConnectionIDs = []

    for (var i = 0; i < this.trackCount; i++) {
      var connection = fetchedConnections[i]

      if (connection) {
        updatedConnectionIDs.push(connection._id)
        if (!this.connectionItems[connection._id]) {
          this.connectionItems[connection._id] = new ConnectionItem(
            connection,
            this,
            i
          )
        } else {
          this.connectionItems[connection._id].update(connection, i)
        }
      } else {
        break
      }
    }

    _.each(this.connectionItems, item => {
      if (updatedConnectionIDs.indexOf(item.connection._id) == -1) {
        item.dismiss(isImmediateDismissal)
      }
    })

    if (this.connections.count() === 0) {
      this.zeroMinuteLine.attr({
        x1: -500,
        x2: -500,
        y2: this.height
      })

      this.tenMinuteLine.attr({
        x1: -500,
        x2: -500,
        y2: this.height
      })
    } else {
      let zeroMinutePosition = this.calculateXPosition(0)
      let tenMinutePosition = this.calculateXPosition(10)
      this.zeroMinuteLine.attr({
        x1: zeroMinutePosition,
        x2: zeroMinutePosition,
        y2: this.height
      })

      this.tenMinuteLine.attr({
        x1: tenMinutePosition,
        x2: tenMinutePosition,
        y2: this.height
      })
    }
  }
  drawLoop (timestamp) {
    this.drawBoard(timestamp)
    requestAnimationFrame(this.drawLoop.bind(this))
  }
  drawBoard (timestamp) {
    this.elapsedTime = (timestamp - this.lastTimestamp) / 1000
    // If window was inactive do not animate with too large delta
    if (this.elapsedTime > 1000) this.elapsedTime = 0
    this.lastTimestamp = timestamp

    _.each(this.connectionItems, connectionItem => {
      connectionItem.draw()
    })

    this.lastTimestamp = timestamp
  }
}

class ConnectionItem {
  constructor (connection, connectionBoard, track) {
    this.connection = connection
    this.connectionBoard = connectionBoard
    this.track = track

    this.ready = false
    this.state = 'new'

    this.svgGroup = this.connectionBoard.draw.group()
    this.svgGroup.attr('id', this.connection._id)
    this.svgGroup.attr('style', 'mix-blend-mode: screen;')
    var vehicle_type = this.connection.hafas_raw.product.longName
    var vehicle_path = ''
    switch (vehicle_type) {
      case 'Tram':
        vehicle_path = tram_name
        break
      case 'Bus':
        vehicle_path = bus_name
        break
      case 'S-Bahn':
        vehicle_path = s_bahn_name
        break
      case 'Schiff':
        vehicle_path = ship_name
        break

      default:
        vehicle_path = train_name
        break
    }

    var instance = this.connectionBoard.draw
      .defs()
      .findOne('#' + vehicle_path)
      .clone()
    this.svgGroup.add(instance)
    this.vehicleWidth = this.svgGroup.findOne('.vehicle-shape').bbox().width
    this.vehicleHeight = this.svgGroup.findOne('.vehicle-shape').bbox().height

    let vehicle_text = this.svgGroup.findOne('.vehicle-text')
    vehicle_text.plain(this.connection.hafas_raw.product.line
      ? this.connection.hafas_raw.product.line
      : this.connection.hafas_raw.product.name)
    
    vehicle_text.attr({
      x: 21,
      y: 3,
    })

    if (
      this.connection.hafas_raw.product.color.bg.toLocaleLowerCase() ==
        'ffffff' ||
      this.connection.hafas_raw.product.color.bg == '000000'
    ) {
      this.svgGroup.findOne('.vehicle-shape').attr({
        style: 'stroke:white; fill:none;'
      })


      if (this.connection.hafas_raw.product.color.fg == '000000') {
        vehicle_text.attr({
          style:
            "stroke:none;fill:white;text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:38pt;"
        })
      } else {
        vehicle_text.attr({
          style:
            'stroke:none;fill:#' +
            this.connection.hafas_raw.product.color.fg +
            ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:38pt;"
        })
      }
    } else {
      this.svgGroup.findOne('.vehicle-shape').attr({
        style:
          'stroke:none;fill:#' +
          this.connection.hafas_raw.product.color.bg +
          '; '
      })

      vehicle_text.attr({
        style:
          'stroke:none;fill:#' +
          this.connection.hafas_raw.product.color.fg +
          ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:38pt;"
      })
    }

    var infoText = getInfoString(this.connection)

    this.infoText = this.svgGroup.text(function (add) {
      add.newLine(infoText[0])
      add.newLine(infoText[1])
    })

    this.infoText.attr({
      class: 'info-text',
      fill: 'white',
      'font-size': '28pt',
      'font-weight': 500,
      x: this.vehicleWidth + 40,
      y: this.vehicleHeight / 2
    })

    this.targetX = -this.connectionBoard.trackWidth
    this.targetY =
      this.connectionBoard.trackHeight * (this.track + 1) -
      this.vehicleHeight +
      this.connectionBoard.trackCenterOffset
    this.X = this.targetX
    this.Y = this.targetY

    this.svgGroup.transform({
      scale: this.connectionBoard.scale,
      translate: [
        this.X - this.vehicleWidth,
        this.Y
      ],
      origin: [this.vehicleWidth, 0]
    })

    this.connectionBoard.draw.add(this.svgGroup)

    this.ready = true
  }

  update (connection, track) {
    this.track = track
    this.connection = connection

    let infoText = getInfoString(this.connection)
    let infoChildren = this.infoText.children()

    infoChildren[0].node.textContent = infoText[0]
    infoChildren[1].node.textContent = infoText[1]

    if (this.connection.hafas_raw.mainLocation.realTime.hasRealTime) {
      this.svgGroup.findOne('.vehicle-text').attr({
        class: 'real_time vehicle-text'
      })
    } else {
      this.svgGroup.findOne('.vehicle-text').attr({
        class: 'vehicle-text'
      })
    }

    this.state = 'update'
  }
  dismiss (isImmediateDismissal) {
    if (isImmediateDismissal) {
      this.svgGroup.remove()
      delete this.connectionBoard.connectionItems[this.connection._id]
    } else {
      if (this.state != 'dismiss') {
        this.state = 'dismiss'

        this.timeOfDismissal = this.connectionBoard.lastTimestamp
      } else {
        // If animation did not end due to inactivity after a second update dismiss immediately
        if (this.lastTimestamp - this.timeOfDismissal > 3000) {
          this.svgGroup.remove()
          delete this.connectionBoard.connectionItems[this.connection._id]
        }
      }
    }
  }
  draw () {
    if (this.ready) {
      if (this.state == 'dismiss') {
        if (this.connection.countdown <= 2) {
          this.targetX = this.connectionBoard.trackWidth * 2
          this.X +=
            this.connectionBoard.trackWidth *
            0.4 *
            this.connectionBoard.elapsedTime

          this.svgGroup.transform({
            scale: this.connectionBoard.scale,
            translate: [
              this.X - this.vehicleWidth,
              this.Y
            ],
            origin: [this.vehicleWidth, 0]
          })

          if (this.X >= this.targetX) {
            this.svgGroup.remove()
            delete this.connectionBoard.connectionItems[this.connection._id]
          }
        } else {
          this.targetX = -this.connectionBoard.trackWidth
          this.X -=
            this.connectionBoard.trackWidth *
            0.4 *
            this.connectionBoard.elapsedTime

          this.svgGroup.transform({
            scale: this.connectionBoard.scale,
            translate: [
              this.X - this.vehicleWidth,
              this.Y
            ],
            origin: [this.vehicleWidth, 0]
          })

          if (this.X <= this.targetX) {
            this.svgGroup.remove()
            delete this.connectionBoard.connectionItems[this.connection._id]
          }
        }
      } else {
        this.targetX = this.connectionBoard.calculateXPosition(
          this.connection.countdown
        )
        this.targetY =
          this.connectionBoard.trackHeight * (this.track + 1) -
          this.vehicleHeight +
          this.connectionBoard.trackCenterOffset

        this.X +=
          (this.targetX - this.X) * 0.45 * this.connectionBoard.elapsedTime
        this.Y +=
          (this.targetY - this.Y) * 1.0 * this.connectionBoard.elapsedTime

        this.svgGroup.transform({
          scale: this.connectionBoard.scale,
          translate: [
            this.X - this.vehicleWidth,
            this.Y
          ],
          origin: [this.vehicleWidth, 0]
        })
      }

      if (
        this.X - (this.vehicleWidth * this.connectionBoard.scale) / 2 >
        this.connectionBoard.trackWidth / 2
      ) {
        this.infoText.children().forEach(span =>
          span.attr({
            x: -40,
            'text-anchor': 'end'
          })
        )
      } else {
        this.infoText.children().forEach(span =>
          span.attr({
            x: this.vehicleWidth + 40,
            'text-anchor': 'start'
          })
        )
      }
    }
  }
}

function htmlDecode (input) {
  var doc = new DOMParser().parseFromString(input, 'text/html')
  return doc.documentElement.textContent
}

function getInfoString (connection) {
  var direction = htmlDecode(connection.hafas_raw.product.direction)
  var countdown = ''

  if (connection.hafas_raw.mainLocation.realTime.hasRealTime) {
    countdown +=
      connection.countdown +
      "' (" +
      connection.hafas_raw.mainLocation.realTime.time +
      ')'
    if (connection.hafas_raw.mainLocation.realTime.platform) {
      countdown += ', '
      countdown += htmlDecode(
        'Pl. ' + connection.hafas_raw.mainLocation.realTime.platform
      )
    }

    countdown += '*'
  } else {
    countdown +=
      connection.countdown +
      "' (" +
      connection.hafas_raw.mainLocation.time +
      ')'
    if (connection.hafas_raw.mainLocation.platform) {
      countdown += ', '
      countdown += htmlDecode(
        'Pl. ' + connection.hafas_raw.mainLocation.platform
      )
    }
  }

  return [direction, countdown]
}
