var zmq = require('zmq')
  , sock_index = zmq.socket('pull');

// private constructor:

var Indexer = module.exports = function Indexer(source, target) {
    this._source = source;
    this._target = target;
};

// use callback for error reporting or return the object
Indexer.prototype.prepare = function(callback) {
    // 1. check data legitimacy (source existence, target write access, etc.)
    // 2. check the existence of tools (jre, opengrok, etc.)
    callback(null, this);
};

// index the source code with opengrok
Indexer.prototype.index = function(callback) {
    // call opengrok to index
    console.log("Indexing "+this._source+" to "+this._target);
    callback(null, this);
};

Indexer.create = function(data, callback) {
    var indexer = new Indexer(data.source, data.target);
    indexer.prepare(function(err, result){
        if (err) callback(err);
        callback(null, result);
    });
};

Indexer.start_service = function(data, callback) {
    sock_index.connect(data.index_url);
    console.log('Worker connected to index queue: '+data.index_url);
    sock_index.on('message', function(src, dst){
        Indexer.create({source:src,target:dst}, function(err, result){
            if (err) console.log('index prepare err');
            result.index(function(err, result){
                if (err) console.log('index err');
                console.log('index worker: %s -> %s', result._source, result._target);
            });
        });
    });
};
