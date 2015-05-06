// sources.js
// Routes to CRUD sources.

var Source = require('../models/source');
var User = require('../models/user');

/**
 * GET /sources
 */
exports.list = function (req, res, next) {
    Source.getAll(function (err, sources) {
        if (err) return next(err);
        res.render('sources', {
            sources: sources,
            alltypes: ['git','mercurial','svn']
        });
    });
};

/**
 * POST /sources
 */
exports.create = function (req, res, next) {
    Source.create({
        name: req.body['name'],
        type: req.body['type'],
        url: req.body['url']
    }, function (err, source) {
        if (err) return next(err);
        res.redirect('/sources/' + source.id);
    });
};

/**
 * GET /sources/:id
 */
exports.show = function (req, res, next) {
    Source.get(req.params.id, function (err, source) {
        if (err) return next(err);
        // TODO also fetch and show followers? (not just follow*ing*)
        User.getEnlisters(source.id, function (err, enlisters){
            res.render('source', {
                source: source,
                enlisters: enlisters,
                alltypes: ['git','mercurial','svn']
            });
        });
    });
};

/**
 * POST /sources/:id
 */
exports.edit = function (req, res, next) {
    Source.get(req.params.id, function (err, source) {
        if (err) return next(err);
        source.name = req.body['name'];
        source.type = req.body['type'];
        source.url = req.body['url'];
        source.save(function (err) {
            if (err) return next(err);
            res.redirect('/sources/' + source.id);
        });
    });
};

/**
 * DELETE /sources/:id
 */
exports.del = function (req, res, next) {
    Source.get(req.params.id, function (err, source) {
        if (err) return next(err);
        source.del(function (err) {
            if (err) return next(err);
            res.redirect('/sources');
        });
    });
};
