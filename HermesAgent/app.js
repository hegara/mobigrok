// worker.js
var Indexer = require('./indexer')
  , Enlister = require('./enlister')
  , Deployer = require('./deployer')
  , path = require('path');
var server_config = {
                        enlist_url: 'tcp://127.0.0.1:3000',
                        index_url: 'tcp://127.0.0.1:3001',
                        deploy_url: 'tcp://127.0.0.1:3002',
                        root_folder: path.resolve(path.join(__dirname, '..', 'tmp')),
                        opengrok_path: 'C:\\Users\\Chundong\\workspace\\OpenGrok\\dist\\opengrok.jar',
                        opengrok_war: 'C:\\Users\\Chundong\\workspace\\OpenGrok\\dist\\source.war',
                        ctags_path: 'C:\\tools\\ctags58\\ctags.exe',                        
                        tomcat_auth: 'jewelry:hegara',
                        tomcat_hostname: 'localhost',
                        tomcat_port: 8080,
                    };

var start_enlister = false;
var start_indexer = false;
var start_deployer = false;
var started = false;

process.argv.forEach(function (v, i, argv) {
    if (i<2) return;
    if (v === "enlist") start_enlister = true;
    else if (v === "index") start_indexer = true; 
    else if (v === "deploy") start_deployer = true; 
});

if (process.argv.length<3) {
    // nothing started. by default kick off all
    start_enlister = true;
    start_indexer = true;
    start_deployer = true;
}

if (start_enlister) { 
    Enlister.start_service(server_config, function(err){
        console.error('enlist service error:\n'+err);
    });
    started = true;
}

if (start_indexer) {
    Indexer.start_service(server_config, function(err){
        console.error('index service error:\n'+err);
    });
    started = true; 
} 

if (start_deployer) {
    Deployer.start_service(server_config, function(err){
        console.error('deploy service error:\n'+err);
    });
    started = true;
}

if (!started) {
    console.error('Nothing started. exiting...');
    process.exit(0);
}