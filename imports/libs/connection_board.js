import snap from './snap.svg-min.js';


const train_path = 'img/train.svg';
const s_bahn_path = 'img/s_bahn.svg';
const tram_path = 'img/tram.svg';
const bus_path = 'img/bus.svg';


export const ConnectionBoard = function (target) {
    this.svg = target;
    this.s = Snap(target);
    this.s.clear();

    this.track_count = 10;
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
    this.s = this.connectionBoard.s;

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
        var height = fragment.select("#shape").getBBox().height;
        fragment.select("#shape").attr({
            style: "stroke:#" + this.connection.hafas_raw.product.color.bg + ";fill:none;"

        });
        console.log(this.connection.hafas_raw.product.color.bg)
        fragment.select("text").attr({
            text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
            style: "stroke:white" + ";fill:#" + this.connection.hafas_raw.product.color.fg + ";text-align:center;"
        });

        if (this.connectionBoard.tracks.length < this.connectionBoard.track_count) {
            this.svgGroup.append(fragment);

            this.track = this.connectionBoard.tracks.length;

            var transformation = Snap.matrix();
            transformation.scale(1.2);
            transformation.translate(0, 90 * (this.connectionBoard.tracks.length + 1) - height);

            this.svgGroup.transform(transformation);

            this.connectionBoard.tracks.push(this);


        }


    }).bind(this));


}

ConnectionItem.prototype.update = (connection) => {

};
