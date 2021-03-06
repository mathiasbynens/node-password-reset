//TODO: Update example

var fs = require('fs');
var express = require('express');
var app = express.createServer();

app.use(express.static(__dirname));
app.use(require('sesame')()); // for sessions

// example nodemailer config here
var forgot = require('../../')({
  uri: 'http://localhost:8080/password_reset',
  from: 'password-robot@localhost',
  transportType: 'SMTP',
  transportOptions: {
    service: "Gmail",
    auth: {
      user: "youmailaccount@gmail.com",
      pass: "password"
    }
  }
});


app.use(forgot.middleware);

app.post('/forgot', express.bodyParser(), function(req, res) {
  var email = req.body.email;

  var callback = {
    error: function(err) {
      res.end('Error sending message: ' + err);
    },
    success: function(success) {
      res.end('Check your inbox for a password reset message.');
    }
  };
  var reset = forgot(email, callback);

  reset.on('request', function(req_, res_) {
    req_.session.reset = {
      email: email,
      id: reset.id
    };
    fs.createReadStream(__dirname + '/forgot.html').pipe(res_);
  });
});

app.post('/reset', express.bodyParser(), function(req, res) {
  if (!req.session.reset) return res.end('reset token not set');

  var password = req.body.password;
  var confirm = req.body.confirm;
  if (password !== confirm) return res.end('passwords do not match');

  // update the user db here

  forgot.expire(req.session.reset.id);
  delete req.session.reset;
  res.end('password reset');
});

app.listen(8080);
console.log('Listening on :8080');
