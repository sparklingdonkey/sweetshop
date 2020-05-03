var mongoose = require('mongoose');
var router = require('express').Router();
var auth = require('../auth');
var passport = require('passport');
var Category = mongoose.model('Category');
var User = mongoose.model('User');
var Product = mongoose.model('Product');
var Order = mongoose.model('Order');

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
    // if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
    //   User.findById(req.payload.id).then(function(user) {
        // if (user) {
          let data = req.body;
          var order = new Order({ 
            products: data.products,
            productsQuantity: data.productsQuantity,
            paymentInfo: data.paymentInfo,
            user: data.user
          });
          
          order.save().then(function(order){          
              res.json({results: [order]});
          }).catch(next);
    //     } else {
    //       return res.sendStatus(401);
    //     }
    //   });
    // } else {
    //   return res.sendStatus(401);
    // }
  });
  
  

module.exports = router;