const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();
app.use(cors());


app.listen(8080, () => console.log("Server Up and running"));

require('./models/Product');
require('./models/Category');
require('./models/Currency');
require('./models/User');
require('./models/Order');


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  res.json({'errors': {
    message: err.message,
    error: err
  }});
});

app.use(bodyParser({limit: '50mb'}));

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

app.use(bodyParser.json())

app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/testdb6');
mongoose.set('debug', true);

require('./config/passport');

app.use(require('./routes'));

