var zmq = require('zmq')
  , sock_deploy = zmq.socket('pull')
  , querystring = require("querystring")
  , spawn = require('child_process').spawn;

// private constructor:

var Deployer = module.exports = function Deployer(name, source_code_path, index_data_path) {
    this._name = name;
    this._source = source_code_path;
    this._index = index_data_path;
};

// deploy the opengrok folder onto tomcat
Deployer.prototype.deploy = function(callback) {
	var deployer = this;
    var query = {
      path: deployer._source,
      war: deployer._index,
      update: false
    };
    var options = {
      auth: Deployer.TomcatAuth,
      hostname: Deployer.TomcatHostname,
      port: Deployer.TomcatPort,
      path: Deployer.TomcatPath+querystring.stringify(query),
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
    var indexer = new Deployer(data.name, data.source_code_path, data.indexed_data_path);
    indexer.prepare(function(err, result){
        if (err) callback(err);
        else {
            callback(null, result);
        }
    });
};

Deployer.start_service = function(config, callback) {
    sock_deploy.connect(config.deploy_url);
    if (!config.tomcat_auth || !config.tomcat_hostname || !config.tomcat_port) {
        callback('Require valid tomcat configuration to be set!');
    } else {
        Deployer.TomcatAuth = config.tomcat_auth;
        Deployer.TomcatHostname = config.tomcat_hostname||'localhost';
        Deployer.TomcatPort = config.tomcat_port||8080;
        Deployer.TomcatPath = config.tomcat_path||'/manager/text/deploy?';
        Deployer.TomcatMethod = config.tomcat_method||'PUT';
        console.info('Worker connected to deploy queue: '+config.deploy_url);
        sock_deploy.on('message', function(name, sourcecode, index_data){
            console.time('deploy-'+name);
            Deployer.create({
                name:name.toString(),
                source_code_path:sourcecode.toString(),
                indexed_data_path:index_data.toString()
            }, function(err, result){
                if (err) callback('deploy prepare err\n'+err);
                result.deploy(function(err, result){
                    if (err) callback('deploy err:\n'+err);
                    else {
                        console.timeEnd('deploy-'+result._name);
                        console.info('deploy worker: %s -> %s', result._source, result._index);
                    }
                });
            });
        });
    }
};