// worker.js
var zmq = require('zmq')
  , sock = zmq.socket('pull');

sock.connect('tcp://127.0.0.1:3000');
console.log('Worker connected to port 3000');

function prepare (name) {
    ;
}

function enlist(url) {
    ;
}

function opengrok() {
    ;
}

sock.on('message', function(name, url, type){
  console.log('work: %s[%s]: %s', name, type, url);
});
