let mongoose = require('mongoose');
let router = require('express').Router();
let auth = require('../auth');
let passport = require('passport');
let Category = mongoose.model('Category');
let User = mongoose.model('User');
let fs = require("fs");
let Product = mongoose.model('Product');

// return a list of tags
router.get('/products', function(req, res, next) {  
    return Product.find().populate({
      path: "category",
      select: ["_id", "title", "description"],
    }).exec(function(err, products) {
      let finalProducts = [];
      if (req.query && req.query.category && req.query.category.length) {
        finalProducts = products.filter(function(product) {
          if (product.category && product.category._id && product.category._id+"" === req.query.category) {
            return true;
          } else {
            return false;
          }
        })
      } else {
        finalProducts = products;
      }

      res.json({results: finalProducts});
    })
});

router.get("/products/:product", function(req, res, next) {  
  return Product.findOne({_id: req.params.product}).populate({
    path: "category",
    select: ["_id", "title", "description"],
  }).exec(function(err, products) {
    res.json({results: [products]});
  })
});

router.post("/img", function(req, res, next) {  
  let base64Data = req.body.picture.replace(/^data:image\/jpeg;base64,/, "");
  let path = "./image/" + req.body.fileName;
  console.log(base64Data);
  fs.writeFile(path, base64Data, "binary", function(err) {
    if (err) {
      console.log(err);
    } else {
      res.send("success");
    }
  });
});

router.get('/image/:img', function(req, res, next) {
  res.sendFile(process.mainModule.paths[0].split('node_modules')[0].slice(0, -1) + '/image/' + req.params.img)
});

router.post('/products', auth.required, function(req, res, next) {
  console.log(req.payload);
  if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
    User.findById(req.payload.id).then(function(user) {
      if (user && user.verifyAdmin(req.payload.id)) {
        let data = req.body.product;
        let product = new Product({
          title: data.title, 
          description: data.description, 
          picture: "", 
          attributes: data.attributes,
          category: data.category,
          price: data.price,
          available: data.available
        });
        product.slugify();
        product.save().then(function(product){
          if (data.picture) {
            let base64Data = data.picture.picture.replace(/^data:image\/jpeg;base64,/, "");
            let path = "./image/" + product._id + ".jpg";
            fs.writeFile(path, base64Data, "binary", function(err) {
              if (err) {
                console.log(err);
              } else {
                Product.findById(product._id).then(function(product) {
                    product.picture = path.slice(1);
                    product.save().then(function() {
                      res.json({results: [product]});
                    })
                });
              }
            });
          } else {
            res.json({results: [product]});
          }
        }).catch(next);
      } else {
        return res.sendStatus(401);
      }
    });
  } else {
    return res.sendStatus(401);
  }
});

router.put('/products', auth.required, function(req, res, next) {
  if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
    User.findById(req.payload.id).then(function(user) {
      if (user && user.verifyAdmin(req.payload.id)) {
        Product.findById(req.body.product._id).then(function(product) {
          product.title = req.body.product.title;
          product.description = req.body.product.description;
          if (req.body.product.picture === "REMOVE") {
              product.picture = "";
          }
          product.attributes = req.body.product.attributes;
          product.category = req.body.product.category;
          product.price = req.body.product.price;
          product.available = req.body.product.available;

          product.save().then(function() {
            if (req.body.product.picture && req.body.product.picture.picture) {
              let base64Data = req.body.product.picture.picture.replace(/^data:image\/jpeg;base64,/, "");
              let path = "./image/" + product._id + ".jpg";
              fs.writeFile(path, base64Data, "binary", function(err) {
                if (err) {
                  console.log(err);
                } else {
                  Product.findById(product._id).then(function(product) {
                      product.picture = path.slice(1);
                      product.save().then(function() {
                        res.json({results: [product]});
                      })
                  });
                }
              });
            } else {
              res.json({results: [product]});
            }
          });
        });
      } else {
        return res.sendStatus(401);
      }
    });
  } else {
    return res.sendStatus(401);
  }
});

router.delete('/products', auth.required, function(req, res, next) {
  if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
    User.findById(req.payload.id).then(function(user) {
      if (user && user.verifyAdmin(req.payload.id)) {
        if (req.body.product.id) {
          Product.findById(req.body.product.id).then(function(product) {
            product.remove().then(function() {
              res.json({id: req.body.product.id});
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



module.exports = router;