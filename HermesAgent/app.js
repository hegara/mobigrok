// worker.js
var Indexer = require('./indexer');
var Enlister = require('./enlister');
var server_config = {enlist_url: 'tcp://127.0.0.1:3000',
                    index_url: 'tcp://127.0.0.1:3001'};

Enlister.start_service(server_config);
Indexer.start_service(server_config);
