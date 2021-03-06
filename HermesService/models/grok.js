// grok.js
// Grok model logic.

var db = require('../lib/neo4j-db-wingman');

// private constructor:

var Grok = module.exports = function Grok(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

db.defineIdProperty(Grok);
db.defineProperty(Grok, 'progress');
db.defineProperty(Grok, 'version');
db.defineProperty(Grok, 'lastUpdated');
db.defineProperty(Grok, 'url');

// public instance methods:

Grok.prototype.save = function (callback) {
    db.save(this, "Grok", callback);
};

Grok.prototype.del = function (callback) {
    db.del('Grok', this.id, ['grok'], callback);
};

Grok.prototype.addGroker = function (source, callback) {
    db.createRelationship(source, this, 'grok', callback);
};

// static methods:

Grok.get = function (id, callback) {
    db.get('Grok', parseInt(id), function(err, result){
        if (err) return callback(err);
        callback(null, new Grok(result));
    });
};

Grok.getAll = function (callback) {
    db.getAll('Grok', function(err, results){
        if (err) return callback(err);
        var Groks = results.map(function (result) {
            return new Grok(result);
        });
        callback(null, Groks);
    });
};

// creates the Grok and persists (saves) it to the db, incl. groking it:
Grok.create = function (data, callback) {
    db.create('Grok', data, function(err, result){
        if (err) return callback(err);
        callback(null, new Grok(result));
    });
};

// calls callback w/ (err, following, others) where following is an array of
// Sources this Grok is groked, and others is all other Groks minus him/herself.
Grok.getGroksForSource = function (sourceId, callback) {
    // query all Groks and whether we follow each one or not:
    var query = [
        'MATCH (g:Grok), (s:Source)',
        'OPTIONAL MATCH (g) <-[rel:grok]- (s)',
        'WHERE ID(s) = {sourceId}',
        'RETURN g, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n');

    var params = {
        sourceId: sourceId,
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);

        var groks = [];

        for (var i = 0; i < results.length; i++) {
            var grok = new Grok(results[i]['g']);
            var ifGroked = results[i]['COUNT(rel)'];

            if (ifGroked) {
                groks.push(grok);
            }
        }
        callback(null, groks);
    });
};