import snap from './snap.svg-min.js';


const train_path = 'img/train.svg';
const s_bahn_path = 'img/s_bahn.svg';
const tram_path = 'img/tram.svg';
const bus_path = 'img/bus.svg';


export const ConnectionBoard = function (target) {
    this.svg = target;
    this.s = Snap(target);
    this.s.clear();
    this.shadow = Snap();

    this.scale = 0.8;
    this.trackWidth = this.s.node.clientWidth;
    this.trackHeight = 90;
    this.trackCount = this.s.node.clientHeight / this.trackHeight / this.scale - 1;



    this.connectionItems = {};

    /* Setup draw loop */
    requestAnimationFrame(this.drawLoop.bind(this));
};

ConnectionBoard.prototype.updateConnections = function (connections) {
    this.connections = connections;

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
    this.draw();

    this.lastTimestamp = timestamp;
    requestAnimationFrame(this.drawLoop.bind(this));
}


ConnectionBoard.prototype.draw = function () {
    _.each(this.connectionItems, (connectionItem) => {
        connectionItem.draw();
    });
};


const ConnectionItem = function (connection, connectionBoard, track) {
    this.connection = connection;
    this.connectionBoard = connectionBoard;
    this.track = track;

    this.ready = false;
    this.state = "new";

    this.s = this.connectionBoard.shadow;
    this.s.clear();

    this.svgGroup = this.s.group();
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

    Snap.load(vehicle_path, ((fragment) => {
        this.vehicleWidth = fragment.select("#shape").getBBox().width;
        this.vehicleHeight = fragment.select("#shape").getBBox().height;
        this.svgGroup.append(fragment);

        if (this.connection.hafas_raw.product.color.bg.toLocaleLowerCase() == "ffffff" || this.connection.hafas_raw.product.color.bg == "000000") {
            this.svgGroup.select("#shape").attr({
                style: "stroke:white; fill:none;"

            });

            if (this.connection.hafas_raw.product.color.fg == "000000") {
                this.svgGroup.select("text").attr({
                    x: 21,
                    text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                    style: "stroke:none;fill:white;text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;"
                });
            } else {
                this.svgGroup.select("text").attr({
                    x: 21,
                    text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                    style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.fg + ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;"
                });
            }


        } else {
            this.svgGroup.select("#shape").attr({
                style: "stroke:none; fill:#" + this.connection.hafas_raw.product.color.bg + "; "
            });

            this.svgGroup.select("text").attr({
                x: 21,
                text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.fg + ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;"
            });
        }

        this.svgGroup.append(fragment);


        var infoText = getInfoString(this.connection);
        let info = this.svgGroup.text(this.vehicleWidth, this.vehicleHeight / 2, infoText).attr({
            class: "info-text",
            fill: "white",
            fontSize: "32",
            fontWeight: 500
        }).selectAll("tspan").forEach((tspan, i) => {
            tspan.attr({
                x: this.vehicleWidth + 40,
                y: 32 * (i + 1) + this.vehicleHeight / 2 - 32 / 2
            });
        });

        this.targetX = -this.connectionBoard.trackWidth;
        this.targetY = this.connectionBoard.trackHeight * (this.track + 1) - this.vehicleHeight;
        this.X = this.targetX;
        this.Y = this.targetY;

        var transformation = Snap.matrix();
        transformation.scale(this.connectionBoard.scale);
        transformation.translate(this.X, this.Y);
        this.svgGroup.transform(transformation);

        this.connectionBoard.s.append(this.svgGroup);

        this.ready = true;

    }).bind(this));
}


ConnectionItem.prototype.update = function (connection, track) {
    this.track = track;
    this.connection = connection;

    let infoText = getInfoString(this.connection);

    let infoChildren = this.svgGroup.select(".info-text").children();

    infoChildren[0].node.textContent = infoText[0];
    infoChildren[1].node.textContent = infoText[1];
};

ConnectionItem.prototype.dismiss = function () {
    if (this.state != "dismiss") {
        this.velocity = 0.005 * this.connectionBoard.trackWidth;
        this.state = "dismiss";
    }
};




ConnectionItem.prototype.draw = function () {
    if (this.ready) {

        if (this.state == "dismiss") {
            this.targetX = this.connectionBoard.trackWidth * 3;
            this.velocity *= 1.1;
            this.X += this.velocity;

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

            this.targetX = this.connectionBoard.trackWidth * 0.6 * temp;
            this.targetY = this.connectionBoard.trackHeight * (this.track + 1) - this.vehicleHeight;

            this.X = this.X + (this.targetX - this.X) * 0.05;
            this.Y = this.Y + (this.targetY - this.Y) * 0.2;

            var transformation = Snap.matrix();
            transformation.scale(this.connectionBoard.scale);
            transformation.translate(this.X, this.Y);
            this.svgGroup.transform(transformation);
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
