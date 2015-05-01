// source.js
// Source model logic.

var neo4j = require('neo4j');
var config = require('../config');
var db = new neo4j.GraphDatabase({
    url:config.neo4j_url,
    auth:config.neo4j_auth
});

// private constructor:

var Source = module.exports = function Source(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

Object.defineProperty(Source.prototype, 'id', {
    get: function () { return this._node._id; }
});

Source.defineProperty = function (prop) {
    Object.defineProperty(Source.prototype, prop, {
        get: function () {
            return this._node.properties[prop] || 'none';
        },
        set: function (name) {
            this._node.properties[prop] = name;
        }
    });
}

Source.defineProperty('name');
Source.defineProperty('type');
Source.defineProperty('url');

// public instance methods:

Source.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Source.prototype.del = function (callback) {
    // use a Cypher query to delete both this Source and the enlisting
    // relationships in one transaction and one network request:
    // (note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var query = [
        'MATCH (source:Source)',
        'WHERE ID(source) = {SourceId}',
        'DELETE source',
        'WITH source',
        'MATCH (source) -[rel:enlist]- (other)',
        'DELETE rel',
    ].join('\n')

    var params = {
        SourceId: this.id
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

// calls callback w/ (err, following, others) where following is an array of
// Sources this Source follows, and others is all other Sources minus him/herself.
Source.prototype.getEnlisters = function (callback) {
    // query all Sources and whether we follow each one or not:
    var query = [
        'MATCH (source:Source), (enlister:User)',
        'OPTIONAL MATCH (source) <-[rel:enlist]- (enlister)',
        'WHERE ID(source) = {SourceId}',
        'RETURN enlister, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n')

    var params = {
        SourceId: this.id,
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);

        var enlisters = [];

        for (var i = 0; i < results.length; i++) {
            var enlister = new Source(results[i]['enlister']);
            var follows = results[i]['COUNT(rel)'];

            if (follows) {
                enlisters.push(enlister);
            }
        }
        callback(null, enlisters);
    });
};

Source.prototype.addEnlister = function (user) {
    user._node.createRelationshipTo(this._node, 'enlist', {}, function (err, rel) {
        callback(err);
    });
}

// static methods:

Source.get = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, new Source(node));
    });
};

Source.getAll = function (callback) {
    var query = [
        'MATCH (Source:Source)',
        'RETURN Source',
    ].join('\n');

    db.query(query, null, function (err, results) {
        if (err) return callback(err);
        var Sources = results.map(function (result) {
            return new Source(result['Source']);
        });
        callback(null, Sources);
    });
};

// creates the Source and persists (saves) it to the db, incl. indexing it:
Source.create = function (data, callback) {

    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var query = [
        'CREATE (source:Source {data})',
        'RETURN source',
    ].join('\n');

    var params = {
        data: data
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        var source = new Source(results[0]['source']);
        callback(null, source);
    });
};
