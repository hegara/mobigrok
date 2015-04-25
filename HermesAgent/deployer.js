var zmq = require('zmq')
  , sock_deploy = zmq.socket('pull')
  , spawn = require('child_process').spawn;

// private constructor:

var Deployer = module.exports = function Deployer(pathname, index_data_path) {
    this._pathname = pathname;
    this._index = index_data_path;
};

// deploy the opengrok folder onto tomcat
Deployer.prototype.deploy = function(callback) {
	var deployer = this;
    var options = {
      auth: Deployer.TomcatAuth,
      hostname: Deployer.TomcatHostname,
      port: Deployer.TomcatPort,
      path: Deployer.TomcatPath.replace('{name}', deployer._pathname).replace('{index}', deployer._index),
      method: Deployer.TomcatMethod,
    };
    
    var content = '';

    var req = require('http').request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        content += chunk;

      });
      res.on('err', function (chunk) {
        grunt.log.error(chunk);
        done(false);
      });
      res.on('end', function (chunk) {
        if(/^OK.*$/m.test(content)) {
          grunt.log.writeln(content);
          done();
        }
        else {
          grunt.log.error(content);
          done(false);
        }
      });
    });

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
    if (!config.tomcat_auth || !config.tomcat_hostname || !config.tomcat_port || !config.tomcat_path) {
        callback('Require valid tomcat configuration to be set!');
    } else {
        Deployer.TomcatAuth = config.tomcat_auth;
        Deployer.TomcatHostname = config.tomcat_hostname||'localhost';
        Deployer.TomcatPort = config.tomcat_port||8080;
        Deployer.TomcatPath = config.tomcat_path||'/manager/text/deploy?path={name}&war={path}&update=false';
        Deployer.TomcatMethod = config.tomcat_method||'PUT';
        console.info('Worker connected to deploy queue: '+data.deploy_url);
        sock_deploy.on('message', function(name, index_data){
            console.time('deploy-'+name);
            Deployer.create({
                pathname:name.toString(),
                indexed_data_path:index_data.toString()
            }, function(err, result){
                if (err) callback('deploy prepare err\n'+err);
                result.deploy(function(err, result){
                    if (err) callback('deploy err:\n'+err);
                    else {
                        console.timeEnd('deploy-'+result._pathname);
                        console.info('deploy worker: %s -> %s', result._pathname, result._index);
                    }
                });
            });
        });
    }
};
e