let mongoose = require('mongoose');
let uniqueValidator = require('mongoose-unique-validator');
let crypto = require('crypto');
let jwt = require('jsonwebtoken');
let secret = require('../config').secret;

let CategorySchema = new mongoose.Schema({
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

