// index.js
// Index model logic.

var neo4j = require('neo4j');
var config = require('../config');
var db = new neo4j.GraphDatabase({
    url:config.neo4j_url,
    auth:config.neo4j_auth
});

// private constructor:

var Index = module.exports = function Index(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

Object.defineProperty(Index.prototype, 'id', {
    get: function () { return this._node._id; }
});

Index.defineProperty = function (prop) {
    Object.defineProperty(Index.prototype, prop, {
        get: function () {
            return this._node.properties[prop] || 'none';
        },
        set: function (name) {
            this._node.properties[prop] = name;
        }
    });
}

Index.defineProperty('progress');
Index.defineProperty('version');
Index.defineProperty('lastUpdated');
Index.defineProperty('url');

// public instance methods:

Index.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Index.prototype.del = function (callback) {
    // use a Cypher query to delete both this Index and the enlisting
    // relationships in one transaction and one network request:
    // (note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var query = [
        'MATCH (index:Index)',
        'WHERE ID(index) = {IndexId}',
        'DELETE index',
        'WITH index',
        'MATCH (index) -[rel:index]- (other)',
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
        'MATCH (index:Index), (src:Source)',
        'OPTIONAL MATCH (index) <-[rel:index]- (src)',
        'WHERE ID(index) = {IndexId}',
        'RETURN src, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n');

    var params = {
        IndexId: this.id,
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);

        var sources = [];

        for (var i = 0; i < results.length; i++) {
            var source = new Index(results[i]['enlister']);
            var index = results[i]['COUNT(rel)'];

            if (index) {
                sources.push(source);
            }
        }
        callback(null, sources);
    });
};

Index.prototype.addIndexer = function (source, callback) {
    db.cypher({
        query: [
            'MATCH (s:Source),(i:Index)',
            'WHERE ID(s)={sourceId} AND ID(i)={indexId}',
			'CREATE (s)-[r:index]->(i)',
            'RETURN r',
        ].join('\n'), 
        params: {
			indexId: this.id,
			sourceId: source.id,
		}
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("no index relationship created!");
        callback(null);
    });
};

// static methods:

Index.get = function (indexId, callback) {
    db.cypher({
        query: [
            'MATCH (index:Index)',
            'WHERE ID(index)= {indexId}',
            'RETURN index',
        ].join('\n'), 
        params: {indexId: parseInt(indexId)}
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("no index found");
        callback(null, new Index(results[0]['index']));
    });
};

Index.getAll = function (callback) {
    var query = [
        'MATCH (Index:Index)',
        'RETURN Index',
    ].join('\n');

    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var Indexs = results.map(function (result) {
            return new Index(result['Index']);
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
