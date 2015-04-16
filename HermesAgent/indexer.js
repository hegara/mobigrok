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
