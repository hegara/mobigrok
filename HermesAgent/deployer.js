var zmq = require('zmq')
  , sock_deploy = zmq.socket('pull')
  , spawn = require('child_process').spawn;

// private constructor:

var Deployer = module.exports = function Deployer(source, target) {
    this._source = source;
    this._target = target;
    this._config = null;
};

// deploy the opengrok folder onto tomcat
Deployer.prototype.deploy = function(callback) {
}

Deployer.create = function(data, callback) {
    var indexer = new Deployer(data.source, data.target);
    indexer.prepare(function(err, result){
        if (err) callback(err);
        else {
            callback(null, result);
        }
    });
};

Deployer.start_service = function(config, callback) {
    sock_deploy.connect(config.deploy_url);
    if (!config.opengrok_path || !config.opengrok_path.match('.jar$')) {
        callback('Require valid opengrok_path to be set!');
    } else if (!config.ctags_path) {
        callback('Require valid ctags_path to be set!');
    } else {
        Deployer.OpenGrokPath = config.opengrok_path;
        Deployer.CtagsPath = config.ctags_path;
        console.info('Worker connected to deploy queue: '+data.deploy_url);
        sock_deploy.on('message', function(src, dst){
            console.time('deploy-'+src);
            Deployer.create({
                source:src.toString(),
                target:dst.toString()
            }, function(err, result){
                if (err) callback('deploy prepare err\n'+err);
                result.deploy(function(err, result){
                    if (err) callback('deploy err:\n'+err);
                    else {
                        console.timeEnd('deploy-'+result._source);
                        console.info('deploy worker: %s -> %s', result._source, result._target);
                    }
                });
            });
        });
    }
};
