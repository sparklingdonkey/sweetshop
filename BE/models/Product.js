var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var ProductSchema = new mongoose.Schema({
    slug: {type: String, lowercase: true, unique: false},
    title: {type: String, required: [true, "cannot be empty."]},
    description: String,
    picture: String,
    attributes: {
      width: {type: String}, 
      length: {type: String},
      height: {type: String}, 
      weight: {type: String}
    },
    available: {type: Boolean, default: false},
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    price: {type: Number, default: 0}
  }, {timestamps: true});

  ProductSchema.plugin(uniqueValidator, {message: "is already taken."});

  ProductSchema.methods.toJSONFor = function(category, currency){
    return {
      slug: this.slug,
      title: this.title,
      available: this.available,
      description: this.description,
      body: this.body,
      price: this.price,
      picture: this.picture,
      category: this.category.toProfileJSONFor(category),
      attributes: this.attributes
    };
  };

  ProductSchema.methods.slugify = function(){
    this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
  };

mongoose.model('Product', ProductSchema);