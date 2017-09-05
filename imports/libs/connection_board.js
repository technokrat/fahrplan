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

    this.track_count = 20;
    this.tracks = [];

    this.connectionItems = [];
}

ConnectionBoard.prototype.updateConnections = function (connections) {
    console.log(connections);

    this.lastUpdate = new Date();
    this.connections = connections;

    this.connections.forEach((connection) => {
        if (!this.connectionItems[connection._id]) {
            this.connectionItems[connection._id] = new ConnectionItem(connection, this);
        } else {
            this.connectionItems[connection._id].update(connection, this.lastUpdate);
        }
    });
};

ConnectionBoard.prototype.draw = function () {

};


const ConnectionItem = function (connection, connectionBoard) {
    this.connection = connection;
    this.connectionBoard = connectionBoard;

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
        var width = fragment.select("#shape").getBBox().width;
        var height = fragment.select("#shape").getBBox().height;
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


        var infoText = [htmlDecode(this.connection.hafas_raw.product.direction), htmlDecode(this.connection.hafas_raw.mainLocation.realTime.countdown + "' (" + this.connection.hafas_raw.mainLocation.realTime.time + "), Pl. " + this.connection.hafas_raw.mainLocation.realTime.platform)];
        let info = this.svgGroup.text(width, height, infoText).attr({
            fill: "white",
            fontSize: "25"
        }).selectAll("tspan").forEach(function (tspan, i) {
            tspan.attr({
                x: width + 40,
                y: 25 * (i + 1) + height / 2 - 25 / 2
            });
        });


        if (this.connectionBoard.tracks.length < this.connectionBoard.track_count) {


            this.track = this.connectionBoard.tracks.length;

            var transformation = Snap.matrix();
            transformation.scale(0.7);
            transformation.translate(0, 90 * (this.connectionBoard.tracks.length + 1) - height);

            this.svgGroup.transform(transformation);

            this.connectionBoard.tracks.push(this);

            this.connectionBoard.s.append(this.svgGroup);


        }


    }).bind(this));


}

ConnectionItem.prototype.update = (connection) => {

};

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}
