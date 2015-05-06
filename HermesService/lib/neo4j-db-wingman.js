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