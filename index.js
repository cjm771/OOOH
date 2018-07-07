
var fs = require('fs');
var util = require('util');
const express = require('express');
var https = require('https');
var http = require('http');
var environment = process.env.NODE_ENV;
//set enviro to production to disable cert lookup
if (environment !== 'production') {
	var privateKey  = fs.readFileSync('ssl/server.key', 'utf8');
	var certificate = fs.readFileSync('ssl/server.crt', 'utf8');
	var credentials = {key: privateKey, cert: certificate};
}

var bodyParser = require('body-parser');

const app = express();
app.use(express.static(__dirname + '/public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/img',express.static(__dirname + '/public/img'));
app.use('/js',express.static(__dirname +  '/public/js'));
app.use('/css',express.static(__dirname +  '/public/css'));
app.use('/fonts',express.static(__dirname +  '/public/fonts'));
app.set('view engine', 'pug');
app.set('views', __dirname +'/public');
//exchange service
let exchangeService = require('./components/ExchangeHelper');

app.get('/', (req, res) => {
      //init the stuff.
      res.render('index');
});
app.post('/api', (req, res) => {
      //init the stuff.
      let authResp = exchangeService.init(req.body.email, req.body.password);
      if (authResp.status === 'success') {
      	exchangeService.getAppointments(req.body.startDate, req.body.endDate, res);
      } else if (authResp.status === 'error') {
      	res.send(authResp);
      } else {
      	res.send(exchangeService.errorJSON('Unknown error occurred: ' + JSON.stringify(authResp)));
      }
      
});

if (environment !== 'production') {
	var httpsServer = https.createServer(credentials, app);
} else {
	var httpsServer = http.createServer(app);
}
httpsServer.listen(3000, () => console.log('Listening on port 3000!'));
