let mongoose = require('mongoose');
let router = require('express').Router();
let auth = require('../auth');
let passport = require('passport');
let Category = mongoose.model('Category');
let User = mongoose.model('User');
let Product = mongoose.model('Product');
let Order = mongoose.model('Order');

router.get('/orders', auth.required, function(req, res, next) {  
    if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
        User.findById(req.payload.id).then(function(user) {
            if (user && user.verifyAdmin(req.payload.id)) {
                return Order.find().populate({
                    path: "products",
                    select: ["_id", "title", "price", "picture", "available"],
                  }).exec(function(err, orders) {
                    res.json({results: orders});
                    })
            } else {
                return res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
});

router.get("/orders/:order", auth.required, function(req, res, next) {  
    if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
        User.findById(req.payload.id).then(function(user) {
            if (user && user.verifyAdmin(req.payload.id)) {
                return Order.findOne({_id: req.params.order}).populate({
                    path: "products",
                    select: ["_id", "title", "price"],
                }).exec(function(err, orders) {
                    res.json({results: [orders]});
                })
            } else {
                return res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
});

router.delete("/orders", auth.required, function(req, res, next) {  
    if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
        User.findById(req.payload.id).then(function(user) {
          if (user && user.verifyAdmin(req.payload.id)) {
            if (req.body.order.id) {
              Order.findById(req.body.order.id).then(function(order) {
                order.remove().then(function() {
                  res.json({id: req.body.order.id});
                })
              })
            }
          } else {
            return res.sendStatus(401);
          }
        });
      } else {
        return res.sendStatus(401);
      }
});

router.post('/orders', function(req, res, next) {
          let data = req.body;
          let order = new Order({ 
            products: data.products,
            productsQuantity: data.productsQuantity,
            paymentInfo: data.paymentInfo,
            user: data.user
          });
          
          order.save().then(function(order){          
              res.json({results: [order]});
          }).catch(next);
  });
  
module.exports = router;