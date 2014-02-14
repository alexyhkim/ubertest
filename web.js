var express = require('express');
var request = require('request');
var app = express();
app.use(express.logger());
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.send("Hello World!");
});

app.get('/data', function(req, res) {
	var promises = [];
	request('http://data.sfgov.org/resource/yitu-d5am.json', function(err, response, body) {
		if (!err && response.statusCode == 200) {
			body = JSON.parse(body);
			res.send(body);
		} else {
			res.send(err);
		}
	});
});

app.get('/geocode', function(req, res) {
	var address = req.query['address'];
	request('http://maps.googleapis.com/maps/api/geocode/json?sensor=false&components=locality:SF&address=' + address + ' San Francisco', function(err, response, body) {
		if (!err && response.statusCode == 200) {
			body = JSON.parse(body);
			if (body['status'] == "OK") {
				var sendObj = body['results'][0]['geometry']['location'];
				sendObj['index'] = req.query['index'];
				res.send(sendObj);
			} else {
				res.send({});
			}
		} else {
			res.send(err);
		}
	});
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});