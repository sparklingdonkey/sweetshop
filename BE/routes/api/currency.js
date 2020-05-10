let router = require('express').Router();
let mongoose = require('mongoose');
let Currrency = mongoose.model('Currency');

router.get('/currency', function(req, res, next) {
    Currrency.find().then(function(currencies){
        return res.json({results: currencies});
  }).catch(next);
});

module.exports = router;