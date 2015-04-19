var zmq = require('zmq')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , sock_enlist = zmq.socket('pull')
  , sock_index = zmq.socket('push')
  , spawn = require('child_process').spawn;

// private constructor:

var Enlister = module.exports = function Enlister(name, url, type) {
    this._name = name;
    this._url = url;
    this._type = type;
};

Enlister.RootFolder = __dirname;
Enlister.AllowedTypes = ["git", "hg", "svn"];
Enlister.UrlPatterns = ["^(http[s]?|git|ssh)://", "^(http[s]?|ssh)://", "^(http[s]?|svn)://"];
Enlister.NameRule = "[a-zA-Z0-9]+[a-zA-Z0-9\-\_\+]*";
Enlister.MaxNameLength = 255;

// use callback for error reporting or return the object
Enlister.prototype.prepare = function(callback) {
    // 1. check data legitimacy (url, type, name, etc.)
    var enlister = this;
    console.info("preparing enlister: %j", enlister);
    var idx_type = Enlister.AllowedTypes.indexOf(enlister._type);
    if (idx_type<0) {
        callback("Not allowed type: "+enlister._type);
        return;
    } else if (!enlister._url.match(Enlister.UrlPatterns[idx_type])) {
        callback("Not supported url: "+enlister._url);
        return;
    } else if (enlister._name.length>Enlister.MaxNameLength || !enlister._name.match(Enlister.NameRule)) {
        callback("Invalid name["+enlister._name.length+"]: "+enlister._name);
        return;
    }
    // 2. check the existence of tools (git, etc.)
    if (this._type === "git") {
        var git_version = spawn("git", ["--version"]);
        git_version.stdout.on('data', function(data){
            var stdout_text = data.toString();
            if (stdout_text.match("^git version [0-9]+\.[0-9]+")) {
                // TODO: check version number?
                console.info("passed git version check!");
                // 3. check the appropriate permission (file access, etc.)
                enlister._path = path.normalize(path.join(Enlister.RootFolder, enlister._name));
                // 4. make directory
                mkdirp(enlister._path, function (err) {
                    if (err) callback(err);
                    else {
                        // 5. enlist!
                        callback(null, enlister);   
                    }
                });         
            } else {
                console.warn("Dropped the ball!! Cannot find proper version of git.");
                console.warn("  got: "+stdout_text);
                callback("Cannot find proper version of git. Found: "+stdout_text);
                return;
            }
        });
    // TODO: add hg/svn support here.
    } else {
        console.warn("Unknown type of source");
        callback("Unknown type of source repository: "+enlister._type);
        return;
    }
}

// enlist the source code with given type of repo tool
// and return the folder containing the source via callback
Enlister.prototype.enlist = function(callback) {
    console.info("Enlisting "+this._name+"["+this._type+"]:"+this._url);
    callback(null, this);
};

Enlister.create = function(data, callback) {
    var enlister = new Enlister(data.name, data.url, data.type);
    console.info('just created: %j', enlister);
    enlister.prepare(function(err, result){
        if (err) callback(err);
        callback(null, result);
    });
};

Enlister.start_service = function(data, callback) {
    sock_enlist.connect(data.enlist_url);
    sock_index.bindSync(data.index_url);
    console.info('Worker connected to enlist queue: '+data.enlist_url);
    Enlister.RootFolder = data.root_folder||Enlister.RootFolder;
    console.info('Enlister is using '+Enlister.RootFolder+' as root.');
    sock_enlist.on('message', function(name, url, type){
        console.time('enlist-'+name);
        Enlister.create({
            name:name.toString(),
            url:url.toString(),
            type:type.toString()
        }, function(err, result){
            if (err) console.error('enlist prepare err:\n'+err);
            else {
                result.enlist(function(err, result){
                    if (err) console.error('enlist err:\n'+err);
                    else {
                        console.timeEnd('enlist-'+result._name);
                        console.info('enlist worker: %s[%s]: %s', result._name, result._type, result._url);
                        sock_index.send([result._path, 
                            path.resolve(path.join(result._path,"..",result._name+"=data"))]);
                    }
                });
            }
        });
    });
};
