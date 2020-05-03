var router = require('express').Router();
var mongoose = require('mongoose');
var auth = require('../auth');
var Category = mongoose.model('Category');
var User = mongoose.model('User');

// return a list of tags
router.get('/category', function(req, res, next) {
    Category.find().then(function(categories){
        return res.json({results: categories});
  }).catch(next);
});

router.post('/category', auth.required, function(req, res, next) {
    if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
        User.findById(req.payload.id).then(function(user) {
            if (user && user.verifyAdmin(req.payload.id)) {
                Category.find({title: req.body.category.title}).then(function(dublicated) {
                    if (dublicated.length) {
                        return res.status(409).json({errors: {title: "already taken"}});
                    } else {
                        var category = new Category(req.body.category);
                        return category.save().then(function(){
                            return res.json({results: [category]});
                        });
                    }
                })
            } else {
                res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
});

router.delete('/category', auth.required, function(req,res,next){
    if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
        User.findById(req.payload.id).then(function(user) {
            if (user && user.verifyAdmin(req.payload.id)) {
                Category.findById(req.body.category.id).then(function(category) {
                    return category.remove().then(function() {
                        return res.sendStatus(200);
                    });      
                })
            } else {
                res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
});

router.put('/category', auth.required, function(req,res,next) {
    if (req.headers && req.headers.authorization && req.payload && req.payload.id) {
        User.findById(req.payload.id).then(function(user) {
            if (user && user.verifyAdmin(req.payload.id)) {
                Category.findOne({title: req.body.category.title}).then(function(dublicated) {
                    if (dublicated && (req.body.category.id+"" !== dublicated._id+"")) {
                        return res.status(409).json({errors: {title: "already taken"}});
                    } else {
                        Category.findById(req.body.category.id).then(function(category) {
                            category.title = req.body.category.title;
                            category.description = req.body.category.description;
        
                            return category.save().then(function() {
                                return res.json({results:[category]});
                            });      
                        })
                    }
                })
            } else {
                res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
});

module.exports = router;