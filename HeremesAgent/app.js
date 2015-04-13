// worker.js
var zmq = require('zmq')
  , sock_enlist = zmq.socket('pull')
  , sock_index = zmq.socket('pull');
var Indexer = require('./indexer');
//var Enlister = require('./enlister');

sock_enlist.connect('tcp://127.0.0.1:3000');
console.log('Worker connected to enlist queue, port 3000');

sock_index.connect('tcp://127.0.0.1:3001');
console.log('Worker connected to index queue, port 3001');

sock_enlist.on('message', function(name, url, type){
  console.log('work: %s[%s]: %s', name, type, url);
});

sock_index.on('message', function(src, dst){
  console.log('work: %s -> %s', src, dst);
});
