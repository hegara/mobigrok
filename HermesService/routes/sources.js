// sources.js
// Routes to CRUD sources.

var Source = require('../models/source');
var User = require('../models/user');
var Grok = require('../models/grok');

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
            if (err) return next(err);
            Grok.getGroksForSource(source.id, function (err, groks){
                if (err) return next(err);
                res.render('source', {
                    source: source,
                    enlisters: enlisters,
                    groks: groks,
                    alltypes: ['git','mercurial','svn']
                });
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

/**
 * POST /sources/:id/grok
 */
exports.grok = function (req, res, next) {
    Source.get(req.params.id, function (err, source) {
        if (err) return next(err);   
        console.log('source found:');
        console.dir(source);     
        Grok.create({
            progress: req.body['progress'],
            version: req.body['version'],
            lastUpdated: req.body['lastUpdated'],
            url: req.body['url']
        }, function (err, grok) {
            if (err) return next(err);
            console.log('grok created!');
            console.dir(grok);
            source.addGrok(grok, function(err) {
                if (err) return next(err);
                res.redirect('/sources/' + source.id);
            })
        });
    });
};