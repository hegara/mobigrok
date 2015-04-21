// worker.js
var Indexer = require('./indexer')
  , Enlister = require('./enlister')
  , path = require('path');
var server_config = {
                        enlist_url: 'tcp://127.0.0.1:3000',
                        index_url: 'tcp://127.0.0.1:3001',
                        root_folder: path.resolve(path.join(__dirname, '..', 'tmp')),
                        opengrok_path: 'C:\\Users\\Chundong\\workspace\\OpenGrok\\dist\\opengrok.jar',
                        ctags_path: 'C:\\tools\\ctags58\\ctags.exe'
                    };

var start_enlister = false;
var start_indexer = false;

process.argv.forEach(function (v, i, argv) {
    if (i<2) return;
    if (v === "enlist") start_enlister = true;
    else if (v === "index") start_indexer = true; 
});

if (process.argv.length<3 && !start_indexer && !start_enlister) {
    // nothing started. by default kick off both
    start_enlister = true;
    start_indexer = true;
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

if (!start_indexer && !start_enlister) {
    console.error('Nothing to start. exiting...');
    process.exit(0);
}