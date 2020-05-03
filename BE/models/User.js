var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, lowercase: true, index: true},
    email: {type: String, unique: true, lowercase: true, index: true},
    bio: String,
    role: {type: String, default: "Customer"},
    image: String,
    isAdmin: {type: Boolean, default: false},
    salt: String,
    hash: String
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: "is already taken."});

UserSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.verifyAdmin = function() { 
    return this.isAdmin;
}

UserSchema.methods.validPassword = function(password){
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};


UserSchema.methods.generateJWT = function(){
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate()+60);

    return jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime()/1000)
    }, secret)
};


UserSchema.methods.toAuthJSON = function(){
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        admin: this.isAdmin,
        bio: this.bio,
        image: this.image,
        token: this.generateJWT()
    };
};


UserSchema.methods.toProfileJSONFor = function(user) {
    return {
        id: this._id,
        username: this.username,
        bio: this.bio,
        admin: this.isAdmin,
        image: this.image,
        role: this.role
    };
};


mongoose.model('User', UserSchema);