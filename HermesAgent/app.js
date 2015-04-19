// worker.js
var Indexer = require('./indexer');
var Enlister = require('./enlister');
var server_config = {enlist_url: 'tcp://127.0.0.1:3000',
                    index_url: 'tcp://127.0.0.1:3001'};

var start_enlister = false;
var start_indexer = false;
var started = false;

process.argv.forEach(function (v, i, argv) {
    if (i<2) return;
    if (v === "enlist") start_enlister = true;
    else if (v === "index") start_indexer = true; 
});

if (!start_indexer && !start_enlister) {
    // nothing started. by default kick off both
    start_enlister = true;
    start_indexer = true;
}

if (start_enlister) { 
    Enlister.start_service(server_config);
    started = true;
}

if (start_indexer) {
    Indexer.start_service(server_config);
    started = true; 
} 
