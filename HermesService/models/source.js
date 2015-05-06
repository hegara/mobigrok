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
    db.del('Source', this.id, ['grok', 'enlist'], callback);
};

Source.prototype.addEnlister = function (user, callback) {
    db.createRelationship(user, this, 'enlist', callback);
};

Source.prototype.addGrok = function (grok, callback) {
    db.createRelationship(this, grok, 'grok', callback);
};

// static methods:

Source.get = function (id, callback) {
    db.get('Source', parseInt(id), function(err, result){
        if (err) return callback(err);
        callback(null, new Source(result));
    });
};

Source.getAll = function (callback) {
    db.getAll('Source', function(err, results){
        if (err) return callback(err);
        var Users = results.map(function (result) {
            return new Source(result);
        });
        callback(null, Users);
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