// index.js
// Index model logic.

var Source = require('source');
var wingman = require('../lib/neo4j-db-wingman');
var db = wingman.db;

// private constructor:

var Index = module.exports = function Index(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

wingman.defineNodeIdProperty(Index);
wingman.defineProperty(Index, 'progress');
wingman.defineProperty(Index, 'version');
wingman.defineProperty(Index, 'lastUpdated');
wingman.defineProperty(Index, 'url');

// public instance methods:

Index.prototype.save = function (callback) {
    db.save(this, "Index", callback);
};

Index.prototype.del = function (callback) {
    // use a Cypher query to delete both this Index and the enlisting
    // relationships in one transaction and one network request:
    // (note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var query = [
        'MATCH (i:Index)',
        'WHERE ID(i) = {IndexId}',
        'DELETE i',
        'WITH i',
        'MATCH (i) -[rel:index]- (other)',
        'DELETE rel',
    ].join('\n');

    var params = {
        IndexId: this.id
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

// calls callback w/ (err, following, others) where following is an array of
// Sources this Index is indexed, and others is all other Indexs minus him/herself.
Index.prototype.getSources = function (callback) {
    // query all Indexs and whether we follow each one or not:
    var query = [
        'MATCH (i:Index), (src:Source)',
        'OPTIONAL MATCH (i) <-[rel:index]- (src)',
        'WHERE ID(i) = {IndexId}',
        'RETURN src, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n');

    var params = {
        IndexId: this.id,
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);

        var sources = [];

        for (var i = 0; i < results.length; i++) {
            var source = new Source(results[i]['src']);
            var index = results[i]['COUNT(rel)'];

            if (index) {
                sources.push(source);
            }
        }
        callback(null, sources);
    });
};

Index.prototype.addIndexer = function (source, callback) {
    db.createRelationship(source, this, 'index', callback);
};

// static methods:

Index.get = function (indexId, callback) {
    db.cypher({
        query: [
            'MATCH (i:Index)',
            'WHERE ID(i)= {indexId}',
            'RETURN i',
        ].join('\n'), 
        params: {indexId: parseInt(indexId)}
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("no index found");
        callback(null, new Index(results[0]['i']));
    });
};

Index.getAll = function (callback) {
    var query = [
        'MATCH (i:Index)',
        'RETURN i',
    ].join('\n');

    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var Indexs = results.map(function (result) {
            return new Index(result['i']);
        });
        callback(null, Indexs);
    });
};

// creates the Index and persists (saves) it to the db, incl. indexing it:
Index.create = function (data, callback) {

    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var query = [
        'CREATE (index:Index {data})',
        'RETURN index',
    ].join('\n');

    var params = {
        data: data
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        var index = new Index(results[0]['index']);
        callback(null, index);
    });
};
