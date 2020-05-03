var mongoose = require('mongoose');
var router = require('express').Router();
var auth = require('../auth');
var User = mongoose.model('User');
var passport = require('passport');

router.post('/users', function(req,res,next){
    var user = new User();
    
    if (req.body.user.username === "admin") {
        user.isAdmin = true;
    }
    
    user.username = req.body.user.username;
    user.email = req.body.user.email;
    user.setPassword(req.body.user.password + "");
    User.findOne({email: req.body.user.email}).then(function(dubUser) {
        if (dubUser) {
            return res.status(422).json({errors: {email: "already taken"}});
        }

        user.save().then(function(){
            return res.json({user: user.toAuthJSON()});
        }).catch(next);
    })
    
});

router.post('/users/login', function(req,res,next){
    if(!req.body.user.email){
        return res.status(422).json({errors: {email: "can't be blank."}});
    }

    if(!req.body.user.password){
        return res.status(422).json({errors: {password: "can't be blank."}});
    }

    passport.authenticate('local', {session: false}, function(err, user, info){
        if(err){return next(err);}

        if(user){
            user.token = user.generateJWT();
            return res.json({user: user.toAuthJSON()});
        } else {
            return res.status(422).json(info);
        }
    })(req,res,next)
});

router.get('/user', auth.required, function(req,res,next){
    User.findById(req.body.user.id).then(function(user){
        if(!user){return res.sendStatus(401);}

        return res.json({user: user.toAuthJSON()});
    }).catch(next);
});

router.put('/user', auth.required, function(req,res,next){
    User.findById(req.body.user.id).then(function(user){
        // if(typeof req.body.user.username !== 'undefined'){
        //     user.username = req.body.user.username;
        // }
        // if(typeof req.body.user.email !== 'undefined'){
        //     user.email = req.body.user.email;
        // }
        // if(typeof req.body.user.bio !== 'undefined'){
        //     user.bio = req.body.user.bio;
        // }
        // if(typeof req.body.user.image !== 'undefined'){
        //     user.image = req.body.user.image;
        // }

        if(!user || !req.body.user.new_password.length || !user.validPassword(req.body.user.password)) {
            return done(null, false, {errors: {"email or password":"is invalid."}})
        }
        user.setPassword(req.body.user.new_password);
        return user.save().then(function(){
            return res.json({user: user.toAuthJSON()});
        });    
    }).catch(next);
});

router.use(function(err,req,res,next){
    if(err.name === 'ValidationError'){
        return res.json({
            errors: Object.keys(err.errors).reduce(function(errors ,key){
                errors[key] = err.errors[key].message;
                return errors;
            }, {})
        })
    }
    return next(err);
});

module.exports = router;