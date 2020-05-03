var router = require('express').Router();
var mongoose = require('mongoose');
var Currrency = mongoose.model('Currency');

// return a list of tags
router.get('/currency', function(req, res, next) {
    Currrency.find().then(function(currencies){
        return res.json({results: currencies});
  }).catch(next);
});

module.exports = router;