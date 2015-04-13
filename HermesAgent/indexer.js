// private constructor:

var Indexer = module.exports = function Indexer(source, target) {
    this._source = source;
    this._target = target;
};

// use callback for error reporting or return the object
Indexer.prototype.prepare = function(callback) {
    // 1. check data legitimacy (url, type, etc.)
    // 2. check the existence of tools (git, etc.)
    // 3. check the appropriate permission (file access, etc.)
    callback(null, this);
};

// index the source code with opengrok
Indexer.prototype.index = function(callback) {
    // call opengrok to index
    console.log("Indexing "+this._source);
    callback(null, true);
};

Indexer.create = function(data, callback) {
    var indexer = new Indexer(data.source, data.target);
    indexer.indexerare(function(err, result){
        if (err) callback(err);
        callback(null, result);
    });
};
