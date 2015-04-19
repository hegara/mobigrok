var zmq = require('zmq')
  , sock_enlist = zmq.socket('pull')
  , sock_index = zmq.socket('push')
  , spawn = require('child_process').spawn;

// private constructor:

var Enlister = module.exports = function Enlister(name, url, type) {
    this._name = name;
    this._url = url;
    this._type = type;
};

Enlister.AllowedTypes = ["git", "hg", "svn"];

// use callback for error reporting or return the object
Enlister.prototype.prepare = function(callback) {
    // 1. check data legitimacy (url, type, etc.)
    var enlister = this;
    console.log("preparing enlister: %j", enlister);
    if (Enlister.AllowedTypes.indexOf(enlister._type)<0) {
        callback("Not allowed type: "+enlister._type);
        return;
    }
    // TODO: add url check
    // 2. check the existence of tools (git, etc.)
    if (this._type === "git") {
        var git_version = spawn("git", ["--version"]);
        git_version.stdout.on('data', function(data){
            var stdout_text = data.toString();
            if (stdout_text.match("^git version [0-9]+\.[0-9]+")) {
                // TODO: check version number?
                console.log("passed git version check!");
                // 3. check the appropriate permission (file access, etc.)
                // 4. make directory
                enlister._path = "c:\\path\\to\\source\\"+enlister._name;
                callback(null, enlister);            
            } else {
                console.log("Dropped the ball!! Cannot find proper version of git.");
                console.log("  got: "+stdout_text);
                callback("Cannot find proper version of git. Found: "+stdout_text);
                return;
            }
        });
    // TODO: add hg/svn support here.
    } else {
        console.log("Unknown type of source");
        callback("Unknown type of source repository: "+enlister._type);
        return;
    }
}

// enlist the source code with given type of repo tool
// and return the folder containing the source via callback
Enlister.prototype.enlist = function(callback) {
    console.log("Enlisting "+this._name+"["+this._type+"]:"+this._url);
    callback(null, this);
};

Enlister.create = function(data, callback) {
    var enlister = new Enlister(data.name, data.url, data.type);
    console.log('just created: %j', enlister);
    enlister.prepare(function(err, result){
        if (err) callback(err);
        callback(null, result);
    });
};

Enlister.start_service = function(data, callback) {
    sock_enlist.connect(data.enlist_url);
    sock_index.bindSync(data.index_url);
    console.log('Worker connected to enlist queue: '+data.enlist_url);
    sock_enlist.on('message', function(name, url, type){
        Enlister.create({
            name:name.toString(),
            url:url.toString(),
            type:type.toString()
        }, function(err, result){
            if (err) console.log('enlist prepare err');
            else {
                result.enlist(function(err, result){
                    if (err) console.log('enlist err');
                    else {
                        console.log('enlist worker: %s[%s]: %s', result._name, result._type, result._url);
                        sock_index.send([result._path, result._path+"\\..\\"+result._name+"-data\\"]);
                    }
                });
            }
        });
    });
};
