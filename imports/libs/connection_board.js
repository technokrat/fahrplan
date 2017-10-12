import snap from './snap.svg-min.js';


const train_path = 'train';
const s_bahn_path = 's_bahn';
const tram_path = 'tram';
const bus_path = 'bus';


export const ConnectionBoard = function (target) {
    this.svg = target;
    this.s = Snap(target);
    this.s.clear();

    this.scale = 0.8;
    this.trackWidth = this.s.node.clientWidth;
    this.trackHeight = 100 * this.scale;
    this.trackCount = Math.floor(this.s.node.clientHeight / this.trackHeight);
    this.trackCenterOffset = (this.s.node.clientHeight % this.trackHeight) / 2;

    this.lastTimestamp = 0;

    this.connectionItems = {};

    this.horizontalOffset = 0;



    this.initVehicleSymbols().then(() => {
        /* Setup draw loop */
        requestAnimationFrame(this.drawLoop.bind(this));
    })
};

ConnectionBoard.prototype.initVehicleSymbols = function () {
    var promise = Promise.all(
        [
            this.loadVehicleSymbol(train_path),
            this.loadVehicleSymbol(s_bahn_path),
            this.loadVehicleSymbol(tram_path),
            this.loadVehicleSymbol(bus_path)
        ]
    );

    return promise;
};

ConnectionBoard.prototype.loadVehicleSymbol = function (vehicle) {
    var promise = new Promise((resolve, reject) => {
        Snap.load("/img/" + vehicle + ".svg", ((fragment) => {
            let path = fragment.select("g");
            path.attr("id", vehicle);
            this.s.select("defs").append(path);
            resolve("Loaded " + vehicle);
        }))
    });

    return promise;
};

ConnectionBoard.prototype.updateConnections = function (connections) {
    this.connections = connections;
    if (connections.length) {
        let maxCountdown = Math.max(this.connections[Math.min(this.connections.length - 1, this.trackCount)].countdown, 5);
        this.horizontalOffset = (Math.pow((60 - Math.min(maxCountdown, 60)) / 60, 3)) / 2 * this.trackWidth / this.scale;
    }


    let updatedConnectionIDs = [];


    for (var i = 0; i < this.trackCount; i++) {
        var connection = this.connections[i];

        if (connection) {
            updatedConnectionIDs.push(connection._id);
            if (!this.connectionItems[connection._id]) {
                this.connectionItems[connection._id] = new ConnectionItem(connection, this, i);
            } else {
                this.connectionItems[connection._id].update(connection, i);
            }
        } else
            break;
    }

    _.each(this.connectionItems, (item) => {
        if (updatedConnectionIDs.indexOf(item.connection._id) == -1) {
            item.dismiss();
        }
    });
};


ConnectionBoard.prototype.drawLoop = function (timestamp) {
    this.draw(timestamp);
    requestAnimationFrame(this.drawLoop.bind(this));
}


ConnectionBoard.prototype.draw = function (timestamp) {
    this.elapsedTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    _.each(this.connectionItems, (connectionItem) => {
        connectionItem.draw();
    });

    this.lastTimestamp = timestamp;
};


const ConnectionItem = function (connection, connectionBoard, track) {
    this.connection = connection;
    this.connectionBoard = connectionBoard;
    this.track = track;

    this.ready = false;
    this.state = "new";

    this.s = this.connectionBoard.s;

    this.svgGroup = this.s.group();
    this.svgGroup.attr('id', this.connection._id);
    this.svgGroup.attr('style', 'mix-blend-mode: screen;');
    var vehicle_type = this.connection.hafas_raw.product.longName;
    var vehicle_path = "";
    switch (vehicle_type) {
        case "Tram":
            vehicle_path = tram_path;
            break;
        case "Bus":
            vehicle_path = bus_path;
            break;
        case "S-Bahn":
            vehicle_path = s_bahn_path;
            break;

        default:
            vehicle_path = train_path;
            break;
    }

    var instance = this.connectionBoard.s.select("#" + vehicle_path).clone();
    this.svgGroup.append(instance);
    this.vehicleWidth = this.svgGroup.select(".vehicle-shape").getBBox().width;
    this.vehicleHeight = this.svgGroup.select(".vehicle-shape").getBBox().height;


    if (this.connection.hafas_raw.product.color.bg.toLocaleLowerCase() == "ffffff" || this.connection.hafas_raw.product.color.bg == "000000") {
        this.svgGroup.select(".vehicle-shape").attr({
            style: "stroke:white; fill:none;"
        });

        if (this.connection.hafas_raw.product.color.fg == "000000") {
            this.svgGroup.select(".vehicle-text").attr({
                x: 21,
                text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                style: "stroke:none;fill:white;text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:32pt;"
            });
        } else {
            this.svgGroup.select(".vehicle-text").attr({
                x: 21,
                text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.fg + ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:32pt;"
            });
        }


    } else {
        this.svgGroup.select(".vehicle-shape").attr({
            style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.bg + "; "
        });

        this.svgGroup.select(".vehicle-text").attr({
            x: 21,
            text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
            style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.fg + ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:32pt;"
        });
    }


    var infoText = getInfoString(this.connection);
    this.infoText = this.svgGroup.text(this.vehicleWidth, this.vehicleHeight / 2, infoText).attr({
        class: "info-text",
        fill: "white",
        fontSize: "32pt",
        fontWeight: 500
    });

    this.tspans = this.infoText.selectAll("tspan").forEach((tspan, i) => {
        tspan.attr({
            x: this.vehicleWidth + 40,
            y: 42 * (i + 1) + (this.vehicleHeight - 84) / 2
        });
    });

    if (this.connection.hafas_raw.mainLocation.realTime.hasRealTime) {
        this.svgGroup.select(".vehicle-text").attr({
            class: "real_time vehicle-text"
        });
    } else {
        this.svgGroup.select(".vehicle-text").attr({
            class: "vehicle-text"
        });
    }

    this.targetX = -this.connectionBoard.trackWidth / 2;
    this.targetY = this.connectionBoard.trackHeight / this.connectionBoard.scale * (this.track + 1) - this.vehicleHeight;
    this.X = this.targetX;
    this.Y = this.targetY;

    var transformation = Snap.matrix();

    transformation.scale(this.connectionBoard.scale);
    transformation.translate(this.X, this.Y);
    this.svgGroup.transform(transformation);

    this.connectionBoard.s.append(this.svgGroup);

    this.ready = true;


};


ConnectionItem.prototype.update = function (connection, track) {
    this.track = track;
    this.connection = connection;

    let infoText = getInfoString(this.connection);
    let infoChildren = this.svgGroup.select(".info-text").children();

    infoChildren[0].node.textContent = infoText[0];
    infoChildren[1].node.textContent = infoText[1];

    if (this.connection.hafas_raw.mainLocation.realTime.hasRealTime) {
        this.svgGroup.select(".vehicle-text").attr({
            class: "real_time vehicle-text"
        });
    } else {
        this.svgGroup.select(".vehicle-text").attr({
            class: "vehicle-text"
        });
    }

    this.state = "update";
};

ConnectionItem.prototype.dismiss = function () {
    if (this.state != "dismiss") {
        this.velocity = 0.005 * this.connectionBoard.trackWidth / this.connectionBoard.scale;
        this.state = "dismiss";
    }
};




ConnectionItem.prototype.draw = function () {
    if (this.ready) {

        if (this.state == "dismiss") {
            this.targetX = this.connectionBoard.trackWidth * 3;
            this.X += this.connectionBoard.trackWidth * 0.2 * this.connectionBoard.elapsedTime;

            var transformation = Snap.matrix();
            transformation.scale(this.connectionBoard.scale);
            transformation.translate(this.X, this.Y);
            this.svgGroup.transform(transformation);

            if (this.X >= this.targetX) {
                this.svgGroup.remove();
                delete this.connectionBoard.connectionItems[this.connection._id];
            }

        } else {

            let temp = Math.pow((60 - Math.min(this.connection.countdown, 60)) / 60, 3);

            this.targetX = (this.connectionBoard.trackWidth / this.connectionBoard.scale - this.vehicleWidth) * temp - this.connectionBoard.horizontalOffset;
            this.targetY = this.connectionBoard.trackHeight * (this.track + 1) / this.connectionBoard.scale - this.vehicleHeight + this.connectionBoard.trackCenterOffset / this.connectionBoard.scale;

            this.X += (this.targetX - this.X) * 0.5 * this.connectionBoard.elapsedTime;
            this.Y += (this.targetY - this.Y) * 1.0 * this.connectionBoard.elapsedTime;

            var transformation = Snap.matrix();
            transformation.scale(this.connectionBoard.scale);
            transformation.translate(this.X, this.Y);
            this.svgGroup.transform(transformation);
        }

        if ((this.vehicleWidth / 2 + this.X) > (this.connectionBoard.trackWidth / this.connectionBoard.scale / 2)) {
            this.tspans.forEach((tspan, i) => {
                tspan.attr({
                    x: -40,
                    textAnchor: "end"
                })
            });
        } else {
            this.tspans.forEach((tspan, i) => {
                tspan.attr({
                    x: this.vehicleWidth + 40,
                    textAnchor: "start"
                });
            });
        }
    }
};




function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}


function getInfoString(connection) {
    var direction = htmlDecode(connection.hafas_raw.product.direction);
    var countdown = "";

    if (connection.hafas_raw.mainLocation.realTime.hasRealTime) {
        countdown += connection.countdown + "' (" + connection.hafas_raw.mainLocation.realTime.time + ")";
        if (connection.hafas_raw.mainLocation.realTime.platform) {
            countdown += ", ";
            countdown += htmlDecode("Pl. " + connection.hafas_raw.mainLocation.realTime.platform);
        }

    } else {
        countdown += connection.countdown + "' (" + connection.hafas_raw.mainLocation.time + ")";
        if (connection.hafas_raw.mainLocation.platform) {
            countdown += ", ";
            countdown += htmlDecode("Pl. " + connection.hafas_raw.mainLocation.platform);
        }
    }



    return [direction, countdown];
}
