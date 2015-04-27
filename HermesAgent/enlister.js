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
    this._path = null;
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
        callback("Not supported url: "+enlister._url+'with pattern: '+Enlister.UrlPatterns[idx_type]);
        return;
    } else if (enlister._name.length>Enlister.MaxNameLength || !enlister._name.match(Enlister.NameRule)) {
        callback("Invalid name["+enlister._name.length+"]: "+enlister._name);
        return;
    }
    // 2. check the existence of tools (git, etc.)
    if (this._type === "git") {
        var git_version = spawn("git", ["--version"]);
        var received_git_version = false;
        git_version.stdout.on('data', function(data){
            // we only care the first line.
            if (received_git_version) return;
            received_git_version = true;

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
                        // 5. ready to enlist!
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
    var enlister = this;
    console.info("Enlisting "+enlister._name+"["+enlister._type+"]:"+enlister._url);    
    var git_clone = spawn("git", ["clone", "--progress",
                "--recursive", "--depth", "1", enlister._url, enlister._path]);
    git_clone.stdout.on('data', function(data) {
        console.info(data.toString());
    });
    git_clone.stderr.on('data', function(data) {
        console.error(data.toString());
    });
    git_clone.on('close', function(code) {
        if (code !== 0) {
            console.log('Enlist process exited with code ' + code);  
            callback('Enlist process exited with code ' + code);
        } else {
            console.info("Enlist done with code: "+code);   
            callback(null, enlister);
        }
    });
};

Enlister.create = function(data, callback) {
    var enlister = new Enlister(data.name, data.url, data.type);
    console.info('just created: %j', enlister);
    enlister.prepare(function(err, result){
        if (err) callback(err);
        callback(null, result);
    });
};

Enlister.start_service = function(config, callback) {
    sock_enlist.connect(config.enlist_url);
    sock_index.bindSync(config.index_url);
    console.info('Worker connected to enlist queue: '+config.enlist_url);
    console.info('Worker bound to index queue: '+config.index_url);
    Enlister.RootFolder = config.root_folder||Enlister.RootFolder;
    console.info('Enlister is using '+Enlister.RootFolder+' as root.');
    sock_enlist.on('message', function(name, url, type){
        console.time('enlist-'+name);
        Enlister.create({
            name:name.toString(),
            url:url.toString(),
            type:type.toString()
        }, function(err, result){
            if (err) callback('enlist prepare err:\n'+err);
            else {
                result.enlist(function(err, result){
                    if (err) callback('enlist err:\n'+err);
                    else {
                        console.timeEnd('enlist-'+result._name);
                        console.info('enlist worker: %s[%s]: %s', result._name, result._type, result._url);
                        sock_index.send([result._name, result._path, 
                            path.resolve(path.join(result._path,"..",result._name+"=grok"))]);
                    }
                });
            }
        });
    });
};
