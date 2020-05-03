var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var CurrencySchema = new mongoose.Schema({
    title: {type: String, unique: true},
    description: String,
    body: String
  }, {timestamps: true});

  CurrencySchema.plugin(uniqueValidator, {message: "is already taken."});

  CurrencySchema.methods.toJSONFor = function(){
    return {
      title: this.title,
      description: this.description,
      body: this.body,
    };
};

CurrencySchema.methods.toProfileJSONFor = function(currency) {
    return {
        title: this.title,
        description: this.description,
        body: this.body
    };
};

mongoose.model('Currency', CurrencySchema);