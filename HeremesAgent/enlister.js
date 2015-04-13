// private constructor:

var Enlister = module.exports = function Indexer(name, url, type) {
    this._name = name;
    this._url = url;
    this._type = type;
};

// use callback for error reporting or return the object
Enlister.prototype.prepare = function(callback) {
    // 1. check data legitimacy (url, type, etc.)
    // 2. check the existence of tools (git, etc.)
    // 3. check the appropriate permission (file access, etc.)
    // 4. make directory
    this._path = "c:\\path\\to\\source\\"+this._name;
    callback(null, this);
}

// enlist the source code with given type of repo tool
// and return the folder containing the source via callback
Enlister.prototype.enlist = function(callback) {
    console.log("Enlisting "+this._name+"["+this._type"]:"+this._url);
    callback(null, this._path);
};

Enlister.create = function(data, callback) {
    var enlister = new Enlister(data.name, data.url, data.type);
    enlister.prepare(function(err, result){
        if (err) callback(err);
        callback(null, result);
    });
};
