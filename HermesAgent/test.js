// producer.js
var zmq = require('zmq')
  , readline = require('readline')
  , sock_enlist = zmq.socket('push');

sock_enlist.bindSync('tcp://127.0.0.1:3000');
console.log('Enlist queue bound to port 3000');
/*
setInterval(function(){
    var value = Math.floor(Math.random()*100);
    console.log('sending enlist task of '+value);
    sock_enlist.send(['name'+value,'url','type']);
}, 500);
*/
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('> ');
rl.prompt();
rl.on('line', function(line) {
    if (line === "close" || line === "end" || line === "exit") rl.close();
    else if (line.match("^enlist")) {
        console.log("enlist requested...");
        args = line.split(" ");
        if (args.length >= 3) {
            var name = args[1].toString();
            var url = args[2].toString();
            var type = args[3]?args[3].toString():"git";
            console.log('sending enlist task of '+name);
            sock_enlist.send([name, url, type]);
        } else {
            console.log("enlist <name> <url> [<type>]");
        }
    }
    console.log("\n");
    rl.prompt();
}).on('close',function(){
    process.exit(0);
});
