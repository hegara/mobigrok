// user.js
// User model logic.

var Source = require('source');
var wingman = require('../lib/neo4j-db-wingman');
var db = wingman.db;

// private constructor:

var User = module.exports = function User(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// public instance properties:

wingman.defineNodeIdProperty(User);
wingman.defineProperty(User, 'name');
wingman.defineProperty(User, 'email');

// public instance methods:

User.prototype.save = function (callback) {
    db.save(this, "User", callback);
};

User.prototype.del = function (callback) {
    // use a Cypher query to delete both this user and his/her following
    // relationships in one transaction and one network request:
    // (note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var query = [
        'MATCH (user:User)',
        'WHERE ID(user) = {userId}',
        'DELETE user',
        'WITH user',
        'MATCH (user) -[rel:follows]- (other)',
        'DELETE rel',
    ].join('\n');

    var params = {
        userId: this.id
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

User.prototype.follow = function (other, callback) {    
    db.createRelationship(this, other, 'follows', callback);
};

User.prototype.unfollow = function (other, callback) {
    var query = [
        'MATCH (user:User) -[rel:follows]-> (other:User)',
        'WHERE ID(user) = {userId} AND ID(other) = {otherId}',
        'DELETE rel',
    ].join('\n');

    var params = {
        userId: this.id,
        otherId: other.id,
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

User.prototype.enlist = function (source, callback) {
    db.createRelationship(this, source, 'enlist', callback);
};

User.prototype.unlist = function (source, callback) {
    var query = [
        'MATCH (user:User) -[rel:enlist]-> (source:Source)',
        'WHERE ID(user) = {userId} AND ID(source) = {sourceId}',
        'DELETE rel',
    ].join('\n');

    var params = {
        userId: this.id,
        sourceId: source.id,
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

// calls callback w/ (err, following, others) where following is an array of
// users this user follows, and others is all other users minus him/herself.
User.prototype.getFollowingAndOthers = function (callback) {
    // query all users and whether we follow each one or not:
    var query = [
        'MATCH (user:User), (other:User)',
        'OPTIONAL MATCH (user) -[rel:follows]-> (other)',
        'WHERE ID(user) = {userId}',
        'RETURN other, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n');

    var params = {
        userId: this.id,
    };

    var user = this;
    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);

        var following = [];
        var others = [];

        for (var i = 0; i < results.length; i++) {
            var other = new User(results[i]['other']);
            var follows = results[i]['COUNT(rel)'];

            if (user.id === other.id) {
                continue;
            } else if (follows) {
                following.push(other);
            } else {
                others.push(other);
            }
        }

        callback(null, following, others);
    });
};

User.prototype.getEnlistingAndOthers = function (callback) {
    // query all sources and whether we enlist each one or not:
    var query = [
        'MATCH (u:User), (s:Source)',
        'OPTIONAL MATCH (u) -[rel:enlist]-> (s)',
        'WHERE ID(u) = {userId}',
        'RETURN s, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n');

    var params = {
        userId: this.id,
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

// static methods:

User.get = function (userId, callback) {
    db.cypher({
        query: [
            'MATCH (user:User)',
            'WHERE ID(user)= {userId}',
            'RETURN user',
        ].join('\n'), 
        params: {userId: parseInt(userId)}
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("no user found");
        callback(null, new User(results[0]['user']));
    });
};

User.getAll = function (callback) {
    var query = [
        'MATCH (user:User)',
        'RETURN user',
    ].join('\n');

    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var users = results.map(function (result) {
            return new User(result['user']);
        });
        callback(null, users);
    });
};

// creates the user and persists (saves) it to the db, incl. indexing it:
User.create = function (data, callback) {

    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var query = [
        'CREATE (user:User {data})',
        'RETURN user',
    ].join('\n');

    var params = {
        data: data
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        var user = new User(results[0]['user']);
        callback(null, user);
    });
};
