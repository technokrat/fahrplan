import snap from './snap.svg-min.js';


const train_path = 'img/train.svg';
const s_bahn_path = 'img/s_bahn.svg';
const tram_path = 'img/tram.svg';
const bus_path = 'img/bus.svg';


export const ConnectionBoard = function (target, track_count) {
    this.svg = target;
    this.s = Snap(target);

    this.track_count = track_count;




}

ConnectionBoard.prototype.updateConnections = function (connections) {
    this.connections = connections;
};

ConnectionBoard.prototype.draw = function () {};


ConnectionBoard.prototype.updateLayout = function (track_count) {
    this.track_count = track_count;
};



const ConnectionItem = function (connection, connection_board) {
    this.connection_board = connection_board;
    this.s = this.connection_board.s;

    var root = this.s.group();
    Snap.load(train_path, function (fragment) {
        fragment.select("text").attr({
            text: 'MAU'
        });
        root.append(fragment);
    });
}
