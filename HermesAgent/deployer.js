var zmq = require('zmq')
  , fs = require('fs')
  , path = require('path')
  , unzip = require('unzip')
  , sock_deploy = zmq.socket('pull')
  , querystring = require("querystring")
  , spawn = require('child_process').spawn;

// private constructor:

var Deployer = module.exports = function Deployer(name, source_code_path, index_data_path) {
    this._name = name;
    this._source = source_code_path;
    this._index = index_data_path;
    this._web = path.resolve(path.join(this._index,'..',this._name+'=web'));
};

// http://tomcat.apache.org/tomcat-7.0-doc/manager-howto.html#Deploy_a_Directory_or_WAR_by_URL
Deployer.TomcatAuth = null;
Deployer.TomcatHostname = 'localhost';
Deployer.TomcatPort = 8080;
Deployer.TomcatPath = '/manager/text/deploy?';
Deployer.TomcatMethod = 'PUT';
Deployer.OpenGrokWar = null;

Deployer.prototype.prepare = function(callback) {
    var deployer = this;
    // copy source.war over and unzip
    var war = fs.createReadStream(Deployer.OpenGrokWar);
    var dir = fstream.Writer({path:deployer._web,type:'Directory'});
    war.pipe(unzip.Parse()).pipe(dir, {end: false});
    war.on('end', function(err)) {
        if (err) console.error('war error: '+err);
        dir.end();

        // replace the web.xml
        var src_web_xml = fs.createReadStream(path.join(deployer._index, 'web.xml'));
        var dst_web_xml = fs.createWriteStream(path.join(deployer._web,'web.xml'));
        src_web_xml.pipe(dst_web_xml, {end:false});
        src_web_xml.on('end', function(err)) {
            if (err) console.error('replacement error: '+err);
            dst_web_xml.end();
        });
    });
};

// deploy the opengrok folder onto tomcat
Deployer.prototype.deploy = function(callback) {
    var deployer = this;
    var query = {
        path: deployer._source,
        war: 'file:'+deployer._index,
        // set to true and existing app with same path will be undeployed first
        update: false, 
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
            callback(chunk);
        });
        res.on('end', function (chunk) {
            console.info('full content:\n'+content);
            if (/^OK.*$/m.test(content)) {
                console.info("deploy done: "+content);
            } else {
                callback(content);
            }
        });
    });
};

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
    if (!config.tomcat_auth || !config.opengrok_war) {
        callback('Require valid tomcat/opengrok configuration to be set!');
    } else {
        console.info('Worker connected to deploy queue: '+config.deploy_url);
        Deployer.TomcatAuth = config.tomcat_auth;
        Deployer.TomcatHostname = config.tomcat_hostname||Deployer.TomcatHostname;
        Deployer.TomcatPort = config.tomcat_port||Deployer.TomcatPort;
        Deployer.TomcatPath = config.tomcat_path||Deployer.TomcatPath;
        Deployer.TomcatMethod = config.tomcat_method||Deployer.TomcatMethod;
        Deployer.OpenGrokWar = config.opengrok_war;
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