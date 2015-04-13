// producer.js
var zmq = require('zmq')
  , sock_enlist = zmq.socket('push')
  , sock_index = zmq.socket('push');

sock_enlist.bindSync('tcp://127.0.0.1:3000');
console.log('Enlist queue bound to port 3000');

sock_index.bindSync('tcp://127.0.0.1:3001');
console.log('Index queue bound to port 3001');

setInterval(function(){
  var value = Math.floor(Math.random()*100);
  console.log('sending enlist task');
  sock_enlist.send(['name'+value,'url','type']);
}, 500);

setInterval(function(){
  var value = Math.floor(Math.random()*100);
  console.log('sending index task');
  sock_index.send(['src'+value,'dst']);
}, 500);
