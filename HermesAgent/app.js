// worker.js
var Indexer = require('./indexer')
  , Enlister = require('./enlister')
  , Deployer = require('./deployer')
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore');
var default_server_config = 
{
    enlist_url: 'tcp://127.0.0.1:3000',
    index_url: 'tcp://127.0.0.1:3001',
    deploy_url: 'tcp://127.0.0.1:3002',
    root_folder: path.resolve(path.join(__dirname, '..', 'tmp')),
    opengrok_path: path.resolve(path.join(__dirname, '..', 'prebuilts', 'opengrok.jar')),
    opengrok_war: path.resolve(path.join(__dirname, '..', 'prebuilts', 'source.war')),
    ctags_path: path.resolve(path.join(__dirname, '..', 'prebuilts', 'ctags.exe')),                        
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

config_file = path.resolve(__dirname,'config.json');
fs.exists(config_file, function(exists){
    if (exists) {
        fs.readFile(config_file, function(err, data){
            if (err) {
                console.warn('Fail to read from config file: '
                    +config_file+' and fall back to default settings');
                start_services(default_server_config);
            } else {
                var server_config = _.extend(default_server_config, JSON.parse(data).default);
                // Resolve the path
                server_config.root_folder = path.resolve(server_config.root_folder);
                server_config.root_folder = path.resolve(server_config.opengrok_path);
                server_config.root_folder = path.resolve(server_config.opengrok_war);
                server_config.root_folder = path.resolve(server_config.root_folder);
                
                start_services(server_config);
            }
        });
    } else {
        console.warn('Fail to find config file: '
                +config_file+' and fall back to default settings');
        start_services(default_server_config);
    }
});

function start_services(server_config) {
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
}