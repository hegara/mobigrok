// users.js
// Routes to CRUD users.

var User = require('../models/user');
var Source = require('../models/source');

/**
 * GET /users
 */
exports.list = function (req, res, next) {
    User.getAll(function (err, users) {
        if (err) return next(err);
        res.render('users', {
            users: users
        });
    });
};

/**
 * POST /users
 */
exports.create = function (req, res, next) {
    User.create({
        name: req.body['name'],
        email: req.body['email']
    }, function (err, user) {
        if (err) return next(err);
        res.redirect('/users/' + user.id);
    });
};

/**
 * GET /users/:id
 */
exports.show = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        // TODO also fetch and show followers? (not just follow*ing*)
        user.getFollowingAndOthers(function (err, following, others) {
            if (err) return next(err);
            Source.getEnlistingAndOthers(user.id, function (err, enlisting, sources) {
                if (err) return next(err);
                res.render('user', {
                    user: user,
                    following: following,
                    others: others,
                    enlisting: enlisting,
                    sources: sources
                });
            });
        });
    });
};

/**
 * POST /users/:id
 */
exports.edit = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        user.name = req.body['name'];
        user.email = req.body['email'];
        user.save(function (err) {
            if (err) return next(err);
            res.redirect('/users/' + user.id);
        });
    });
};

/**
 * DELETE /users/:id
 */
exports.del = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        user.del(function (err) {
            if (err) return next(err);
            res.redirect('/users');
        });
    });
};

/**
 * POST /users/:id/follow
 */
exports.follow = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        User.get(req.body.user.id, function (err, other) {
            if (err) return next(err);
            user.follow(other, function (err) {
                if (err) return next(err);
                res.redirect('/users/' + user.id);
            });
        });
    });
};

/**
 * POST /users/:id/unfollow
 */
exports.unfollow = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        User.get(req.body.user.id, function (err, other) {
            if (err) return next(err);
            user.unfollow(other, function (err) {
                if (err) return next(err);
                res.redirect('/users/' + user.id);
            });
        });
    });
};

/**
 * POST /users/:id/enlist
 */
exports.enlist = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        Source.get(req.body.source.id, function (err, source) {
            if (err) return next(err);
            user.enlist(source, function (err) {
                if (err) return next(err);
                res.redirect('/users/' + user.id);
            });
        });
    });
};

/**
 * POST /users/:id/unlist
 */
exports.unlist = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        Source.get(req.body.source.id, function (err, source) {
            if (err) return next(err);
            user.unlist(source, function (err) {
                if (err) return next(err);
                res.redirect('/users/' + user.id);
            });
        });
    });
};
