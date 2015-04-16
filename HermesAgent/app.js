// worker.js
var zmq = require('zmq')
  , sock_enlist_pull = zmq.socket('pull')
  , sock_index_pull = zmq.socket('pull')
  , sock_index_push = zmq.socket('push');;
var Indexer = require('./indexer');
var Enlister = require('./enlister');

sock_enlist_pull.connect('tcp://127.0.0.1:3000');
console.log('Worker connected to enlist queue, port 3000');

sock_index_pull.connect('tcp://127.0.0.1:3001');
console.log('Worker connected to index queue, port 3001');

sock_index_push.bindSync('tcp://127.0.0.1:3001');
console.log('Index queue bound to port 3001');

sock_enlist_pull.on('message', function(name, url, type){
    Enlister.create({name:name,url:url,type:type}, function(err, result){
        if (err) console.log('enlist prepare err');
        result.enlist(function(err, result){
            if (err) console.log('enlist err');
            console.log('enlist worker: %s[%s]: %s', result._name, result._type, result._url);
            sock_index_push.send([result._path, result._path+"\\..\\"+result._name+"-data\\"]);
        });
    });
});

sock_index_pull.on('message', function(src, dst){
    Indexer.create({source:src,target:dst}, function(err, result){
        if (err) console.log('index prepare err');
        result.index(function(err, result){
            if (err) console.log('index err');
            console.log('index worker: %s -> %s', result._source, result._target);
        });
    });
});
