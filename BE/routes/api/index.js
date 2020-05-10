var router = require('express').Router();

router.use('/', require('./products'));
router.use('/', require('./category'));
router.use('/', require('./currency'));
router.use('/', require('./users'));
router.use('/', require('./orders'));

module.exports = router;