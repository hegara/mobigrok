// Helper class to make a stronger GraphDatabase

var config = require('../config');
var neo4j = require('neo4j');
var _ = require('underscore');
var util = require('util');
var neo4jdb = new neo4j.GraphDatabase({
    url:config.neo4j_url,
    auth:config.neo4j_auth
});

_.extend(exports, neo4jdb);

exports.create = function (klazz_name, data, callback) {
    this.cypher({
        query: [
            'CREATE (o:'+klazz_name+' {data})',
            'RETURN o',
        ].join('\n'), 
        params: {
            data: data
        }
    }, function (err, results) {
        if (err) return callback(err);
        callback(null, results[0]['o']);
    });
};

exports.createRelationship = function (from, to, rel_name, callback) {
    this.cypher({
        query: [
            'MATCH (from),(to)',
            'WHERE ID(from)={fromId} AND ID(to)={toId}',
            'CREATE (from)-[r:'+rel_name+']->(to)',
            'RETURN r',
        ].join('\n'), 
        params: {
            fromId: from.id,
            toId: to.id,
        }
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("no relationship created for "+rel_name);
        callback(null, results[0]);
    });
};

exports.del = function (klazz_name, id, rel_names, callback) {
    var query = [
        'MATCH (o:'+klazz_name+')',
        'WHERE ID(o) = {objId}',
        'DELETE o',
    ].join('\n');

    for (var i = rel_names.length - 1; i >= 0; i--) {
        if (typeof rel_names[i] != "undefined") {
            query.push('WITH o');
            query.push('MATCH (o) -[rel'+i+':'+rel_names[i]+']- (other)');
            query.push('DELETE rel'+i);
        }
    };

    var params = {
        objId: id
    };

    this.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

exports.defineIdProperty = function (klazz) {
    Object.defineProperty(klazz.prototype, 'id', {
        get: function () { return this._node._id; }
    });
};

exports.defineProperty = function (klazz, prop) {
    Object.defineProperty(klazz.prototype, prop, {
        get: function () {
            return this._node.properties[prop] || 'none';
        },
        set: function (name) {
            this._node.properties[prop] = name;
        }
    });
};

exports.get = function (klazz_name, id, callback) {
    this.cypher({
        query: [
            'MATCH (o:'+klazz_name+')',
            'WHERE ID(o)= {objId}',
            'RETURN o',
        ].join('\n'), 
        params: {objId: id}
    }, function (err, results) {
        if (err) return callback(err);
        if (!results[0]) return callback("No "+klazz_name+" found!");
        callback(null, results[0]['o']);
    });
};

exports.getAll = function (klazz_name, callback) {
    var query = [
        'MATCH (o:'+klazz_name+')',
        'RETURN o',
    ].join('\n');

    this.cypher(query, function (err, results) {
        if (err) return callback(err);
        var pure_results = results.map(function (result) {
            return result['o'];
        });
        callback(null, pure_results);
    });
};

exports.save = function (obj, name, cb) {
    var query = [
        'MATCH (o:'+name+')',
        'WHERE ID(o) = {ObjId}',        
    ];
    var set_clouse = [];
    Object.getOwnPropertyNames(obj).forEach(function(propName){
        // TODO: primitive type properties?
        set_clouse.push(
            'o.'+propName+'=\''+
                Object.getOwnPropertyDescriptor(obj,propName).value+'\''
        );
    });
    query.push('SET '+set_clouse.join(','));
    var params = {
        ObjId: obj.id
    };

    this.cypher({
        query:query.join('\n'), 
        params:params
    }, 
    function (err) {
        cb(err);
    });
};