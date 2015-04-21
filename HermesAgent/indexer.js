var zmq = require('zmq')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , sock_index = zmq.socket('pull')
  , spawn = require('child_process').spawn;

// private constructor:

var Indexer = module.exports = function Indexer(source, target) {
    this._source = source;
    this._target = target;
    this._config = null;
};

Indexer.OpenGrokPath = null;
Indexer.CtagsPath = null;

// use callback for error reporting or return the object
Indexer.prototype.prepare = function(callback) {
    // 1. check data legitimacy (source existence, target write access, etc.)
    var indexer = this;
    fs.exists(indexer._source, function (exists) {
        if (!exists) callback('Cannot find source!'+indexer._source);
        else {
            // 2. check the existence of tools (jre, opengrok, etc.)           
            fs.exists(Indexer.OpenGrokPath, function (exists) {
                if (!exists) callback('Cannot find opengrok!'+Indexer.OpenGrokPath);
                else { 
                    var java_version = spawn("java", ["-version"]);
                    var received_java_version = false;
                    console.info('checking java_version: '+Indexer.OpenGrokPath);
                    java_version.stderr.on('data', function(data){
                        // we only care the first line.
                        if (received_java_version) return;
                        received_java_version = true;

                        console.info('java_version result back: '+data.toString());
                        var stdout_text = data.toString();
                        // TODO: check version number?
                        if (stdout_text.match("^java version \"[0-9]+\.[0-9]+")) {
                            // 3. make directory
                            console.info('to make dir: '+indexer._target)
                            mkdirp(indexer._target, function (err) {
                                if (err) callback(err);
                                else {
                                    indexer._config = path.resolve(path.join(indexer._target, "configuration.xml"));
                                    // 4. ready to index!
                                    callback(null, indexer);
                                }
                            });       
                        } else {
                            console.warn("Dropped the ball!! Cannot find proper version of java.");
                            console.warn("  got: "+stdout_text);
                            callback("Cannot find proper version of java. Found: "+stdout_text);
                            return;
                        }
                    });
                }
            });
        }
    });
};

// index the source code with opengrok
Indexer.prototype.index = function(callback) {
    var indexer = this;
    // call opengrok to index
    console.info("Indexing "+indexer._source+" to "+indexer._target);   
    var opengrok_index = spawn("java", ["-jar", Indexer.OpenGrokPath,
                "-c", Indexer.CtagsPath, "-d", indexer._target, "-s", indexer._source, 
                "-W", indexer._config, "-v"]);
    opengrok_index.stdout.on('data', function(data) {
        console.info(data.toString());
    });
    opengrok_index.stderr.on('data', function(data) {
        console.error(data.toString());
    });
    opengrok_index.on('close', function(code) {
        if (code !== 0) {
            console.log('Indexing process exited with code ' + code);  
            callback('Indexing process exited with code ' + code);
        } else {
            console.info("Index done with code: "+code+" under "+indexer._config);
            callback(null, indexer);
        }
    });
};

Indexer.create = function(data, callback) {
    var indexer = new Indexer(data.source, data.target);
    indexer.prepare(function(err, result){
        if (err) callback(err);
        else {
            callback(null, result);
        }
    });
};

Indexer.start_service = function(data, callback) {
    sock_index.connect(data.index_url);
    if (!data.opengrok_path || !data.opengrok_path.match('.jar$')) {
        callback('Require valid opengrok_path to be set!');
    } else if (!data.ctags_path) {
        callback('Require valid ctags_path to be set!');
    } else {
        Indexer.OpenGrokPath = data.opengrok_path;
        Indexer.CtagsPath = data.ctags_path;
        console.info('Worker connected to index queue: '+data.index_url);
        sock_index.on('message', function(src, dst){
            console.time('index-'+src);
            Indexer.create({
                source:src.toString(),
                target:dst.toString()
            }, function(err, result){
                if (err) callback('index prepare err\n'+err);
                result.index(function(err, result){
                    if (err) callback('index err:\n'+err);
                    else {
                        console.timeEnd('index-'+result._source);
                        console.info('index worker: %s -> %s', result._source, result._target);
                    }
                });
            });
        });
    }
};
