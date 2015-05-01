// worker.js
var Indexer = require('./indexer')
  , Enlister = require('./enlister')
  , Deployer = require('./deployer')
  , path = require('path')
  , fs = require('fs')
  , os = require('os')
  , _ = require('underscore');

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
                console.error('Fail to read from config file: '
                    +config_file+' and fall back to default settings');
            } else {
                var config_obj = JSON.parse(data);
                var server_config = _.extend(config_obj.default, config_obj[os.hostname()]);
                // Resolve the path
                server_config.root_folder = path.resolve(server_config.root_folder);
                server_config.root_folder = path.resolve(server_config.opengrok_path);
                server_config.root_folder = path.resolve(server_config.opengrok_war);
                server_config.ctags_path = path.resolve(server_config.ctags_path);
                
                start_services(server_config);
            }
        });
    } else {
        console.error('Fail to find config file: '
                +config_file+' and fall back to default settings');
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