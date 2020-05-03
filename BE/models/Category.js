var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var CategorySchema = new mongoose.Schema({
    // slug: {type: String, lowercase: true, unique: true, },
    title: {type: String, required: [true, "cannot be empty."]},
    description: String,
    body: String
  }, {timestamps: true});

  CategorySchema.plugin(uniqueValidator, {message: "is already taken."});

  CategorySchema.methods.slugify = function(){
    this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
  };

CategorySchema.methods.toJSONFor = function(){
    return {
      id: this._id,
      title: this.title,
      description: this.description,
      body: this.body,
    };
};

CategorySchema.methods.toProfileJSONFor = function(category) {
    return {
        id: this._id,
        title: this.title,
        description: this.description,
        body: this.body
    };
};

mongoose.model('Category', CategorySchema);

