// source.js
// Source model logic.

var db = require('../lib/neo4j-db-wingman');
// private constructor:

var Source = module.exports = function Source(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

db.defineIdProperty(Source);
db.defineProperty(Source, 'name');
db.defineProperty(Source, 'type');
db.defineProperty(Source, 'url');

// public instance methods:

Source.prototype.save = function (callback) {
    db.save(this, "Source", callback);
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
        'MATCH (source) -[rel1:enlist]- (other)',
        'DELETE rel1',
        'WITH source',
        'MATCH (source) -[rel2:index]- (other)',
        'DELETE rel2',
    ].join('\n');

    var params = {
        SourceId: this.id
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

Source.prototype.addEnlister = function (user, callback) {
    db.createRelationship(user, this, 'enlist', callback);
};

// static methods:

Source.get = function (srcId, callback) {
    db.cypher({
        query: [
            'MATCH (src:Source)',
            'WHERE ID(src)= {srcId}',
            'RETURN src',
        ].join('\n'), 
        params: {srcId: parseInt(srcId)}
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("no source found");
        callback(null, new Source(results[0]['src']));
    });
};

Source.getAll = function (callback) {
    var query = [
        'MATCH (Source:Source)',
        'RETURN Source',
    ].join('\n');

    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var Sources = results.map(function (result) {
            return new Source(result['Source']);
        });
        callback(null, Sources);
    });
};

// creates the Source and persists (saves) it to the db, incl. indexing it:
Source.create = function (data, callback) {
    db.create('Source', data, function(err, result){
        if (err) return callback(err);
        callback(null, new Source(result));
    });
};

Source.getEnlistingAndOthers = function (userId, callback) {
    // query all sources and whether we enlist each one or not:
    var query = [
        'MATCH (u:User), (s:Source)',
        'OPTIONAL MATCH (u) -[rel:enlist]-> (s)',
        'WHERE ID(u) = {userId}',
        'RETURN s, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n');

    var params = {
        userId: userId,
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) callback(err);

        var enlisting = [];
        var others = [];

        for (var i = 0 ; i < results.length ; i++) {
            var other = new Source(results[i]['s']);
            var enlists = results[i]['COUNT(rel)'];
            if (enlists) {
                enlisting.push(other);
            } else {
                others.push(other);
            }
        }

        callback(null, enlisting, others);
    });
};