
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, '/public/favicon.ico')));
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'uwotm8' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

app.locals.title = 'mobigrok';// default title

// Routes

app.get('/', routes.site.index);

app.get('/users', routes.users.list);
app.post('/users', routes.users.create);
app.get('/users/:id', routes.users.show);
app.delete('/users/:id', routes.users.del);
app.post('/users/:id', routes.users.edit);

app.post('/users/:id/follow', routes.users.follow);
app.post('/users/:id/unfollow', routes.users.unfollow);

app.get('/sources', routes.sources.list);
app.post('/sources', routes.sources.create);
app.get('/sources/:id', routes.sources.show);
app.delete('/sources/:id', routes.sources.del);
app.post('/sources/:id', routes.sources.edit);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening at: http://localhost:%d/', app.get('port'));
});
