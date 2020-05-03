var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;


var OrderSchema = new mongoose.Schema({
    products:  [{ type: [mongoose.Schema.Types.ObjectId], ref: 'Product' }],
    productsQuantity: {type: [Number]},
    paymentInfo: {type: String},
    user: { type: [mongoose.Schema.Types.ObjectId], ref: 'User' }
  }, {timestamps: true});

OrderSchema.methods.toJSONFor = function(){
    return {
        products: this.products,
        productsQuantity: this.productsQuantity,
        paymentInfo: this.paymentInfo,
        user: this.user
    };
};



mongoose.model('Order', OrderSchema);