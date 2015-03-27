// sources.js
// Routes to CRUD sources.

var Source = require('../models/source');

/**
 * GET /sources
 */
exports.list = function (req, res, next) {
    User.getAll(function (err, sources) {
        if (err) return next(err);
        res.render('sources', {
            sources: sources
        });
    });
};

/**
 * POST /sources
 */
exports.create = function (req, res, next) {
    User.create({
        name: req.body['name']，
        type: req.body['type']，
        url: req.body['url']
    }, function (err, user) {
        if (err) return next(err);
        res.redirect('/sources/' + user.id);
    });
};

/**
 * GET /sources/:id
 */
exports.show = function (req, res, next) {
    User.get(req.params.id, function (err, source) {
        if (err) return next(err);
        // TODO also fetch and show followers? (not just follow*ing*)
        source.getFollowingAndOthers(function (err, following, others) {
            if (err) return next(err);
            res.render('source', {
                source: source,
                following: following,
                others: others
            });
        });
    });
};