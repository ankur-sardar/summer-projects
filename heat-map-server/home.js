//
//Created by Ankur Sardar( ankur.sardar18@gmail.com )
//

var redis = require('redis');
var PORT = 8080;
var express = require('express')
    , app = module.exports = express();
 
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
var fs = require('fs');
var data = fs.readFileSync('employee.csv', 'utf8'); // reading beaconId from a csv file
var beacon = data.split(/[\r\n]+/);
var key = [];
for (i = 0; i < beacon.length; i++) {	
    var temp = beacon[i].split(',');
	key[i] = temp[1];
}

var router = express.Router();
var path = require('path');
var server = app.listen(PORT, function() {
	console.log('Server is running at Port ' + PORT);
});
var timeSpent = 0;
var numberOfReader = 3;
var redisClient = redis.createClient();
redisClient.on('connect', function() {
	console.log('redisClient connected');
})
var timestamp = new Date();
var d = timestamp.getDate();
var m = timestamp.getMonth() + 1;
var y = timestamp.getYear() + 1900;
app.use(express.static(__dirname + '/Assets'));

// Home page
app.get('/', function(req, res) {
	var fs = require('fs');
	var data = fs.readFileSync('employee.csv', 'utf8'); // reading beaconId from a csv file
	var beacon = data.split(/[\r\n]+/);
	var option = [];
	for(i = 0; i < beacon.length; i++) {
    	var temp = beacon[i].split(',');
    	option[i] = { name: temp[0], id: temp[1]};
	}
    res.render('home', { name: option });
});

// Heat map for a person
app.get('/heatmap', function(req, res) {
    res.render('heatmap');
	var employeeName = req.query['employeename'];
	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket) {
		console.log('A client is connected!');
		var fs = require('fs');
        var data = fs.readFileSync('reader_coordinate.csv', 'utf8'); // reading beaconId from a csv file
        var reader = data.split(/[\r\n]+/);
        var position = [];
        for(i = 0; i < reader.length; i++) {
            var temp = reader[i].split(',');
            position[i] = temp[1] + ',' + temp[2];
        }
        socket.emit('position', position);

        var heatMapTime = [];	
		for (var k = 0; k < numberOfReader; k++) {
			heatMapTime[k] = 0;
		}
		var timeSpent = 0;
    	var keyIn = employeeName + '-' + y + '-' + m + '-' + d; 
		var keyAcessTime = keyIn + 'access-time'; //key to find access time of a person
		redisClient.lrange(keyAcessTime, 0, -1, function(err, result) { 
			console.log('Access-list: ' + result);
		});
		var multi = redisClient.multi();
		multi.llen(keyAcessTime, function(err, result) {
			if (err) {
				console.log(err);
			}
		});
		multi.lrange(keyAcessTime, 0, -1);
		multi.exec(function(err, result) {
			var inTime = result[1];
			var outTime = result[2];
			var timeSpent = 0;
			for (i = 0; i < result[0]; i+= 2) {
				var bid = inTime[i].split(',');
				var rid = bid[0];
				var time = bid[1].split(':');
				var inTimeSeconds =  +time[0] * 60 + +time[1];
				var temp = inTime[i+1].split(',');
				var outTime = temp[1].split(':');
				var outTimeSeconds = +outTime[0] * 60 + +outTime[1];
				var timeSpent = outTimeSeconds - inTimeSeconds;
				heatMapTime[rid] = heatMapTime[rid] + timeSpent;
			}
			socket.emit('message', heatMapTime);
		});
		redisClient.get(employeeName, function(error, result) {
			socket.emit('title', 'Heat Map of: ' + result);	
		});
	})
})

// Heat map for today
app.get('/heatmap-today', function(req, res) {	
    res.render('heatmap');    
	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket) {
		console.log('A client is connected!');
        var fs = require('fs');
        var data = fs.readFileSync('reader_coordinate.csv', 'utf8'); // reading beaconId from a csv file
        var reader = data.split(/[\r\n]+/);
        var position = [];
        for(i = 0; i < reader.length; i++) {
            var temp = reader[i].split(',');
            position[i] = temp[1] + ',' + temp[2];
        }
        socket.emit('position', position);
		
        var heatMapTime = [];	
		for (var k = 0; k < numberOfReader; k++) {
			heatMapTime[k] = 0;
		}
		for (var j = 0; j < key.length ; j++) {
			var timeSpent = 0;
    		var keyIn = key[j] + '-' + y + '-' + m + '-' + d;
			var keyAcessTime = keyIn + 'access-time'; //key to find access time of a person
			redisClient.lrange(keyAcessTime, 0, -1, function(err, result) { 
				console.log('Access-list: ' +result);
			});
			var multi = redisClient.multi();
			multi.llen(keyAcessTime, function(err, result) {
				if (err) {
					console.log(err);
				}
			});
			multi.lrange(keyAcessTime, 0, -1);
			multi.exec(function(err, result) {
				var inTime = result[1];
				var outTime = result[2];
				var timeSpent = 0;
				for (i = 0; i < result[0]; i+= 2) {
					var bid = inTime[i].split(',');
					var rid = bid[0];
					var time = bid[1].split(':');
					var inTimeSeconds =  +time[0] * 60 + +time[1];
					var temp = inTime[i+1].split(',');
					var outTime = temp[1].split(':');
					var outTimeSeconds = +outTime[0] * 60 + +outTime[1];
					var timeSpent = outTimeSeconds - inTimeSeconds;
					heatMapTime[rid] = heatMapTime[rid] + timeSpent;	
				}
				socket.emit('message', heatMapTime);
				socket.emit('title', 'Heat Map on: ' +  y + '-' + m + '-' + d);

			});

		}
	})
})

//Heat map for a date
app.get('/heatmap-date', function(req, res) {
    res.render('heatmap');
	var heatMapTime = [];	
	for (var k = 0; k < numberOfReader; k++) {
		heatMapTime[k] = 0;
	}
	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket) {
        var fs = require('fs');
        var data = fs.readFileSync('reader_coordinate.csv', 'utf8'); // reading beaconId from a csv file
        var reader = data.split(/[\r\n]+/);
        var position = [];
        for(i = 0; i < reader.length; i++) {
            var temp = reader[i].split(',');
            position[i] = temp[1] + ',' + temp[2];
        }
        socket.emit('position', position);
		
        console.log('A client is connected!');
		var fromDate = req.query['from'];
		var toDate = req.query['to'];
		var tempFrom = fromDate.split('-');
		var tempTo = toDate.split('-');
		var dayDifference = +tempTo[0] * 365 + +tempTo[1] * 30 + +tempTo[2] - +tempFrom[0] * 365 - +tempFrom[1] * 30 - +tempFrom[2];
		console.log('day dayDifference: ' + dayDifference);
		for (j = 0; j < key.length; j++) {
			for (days = 0; days <= dayDifference; days++) {
				var d = +tempFrom[2] + days;
				var timeSpent = 0;
				var keyIn = key[j] + '-' + tempFrom[0] + '-' + parseInt(tempFrom[1],10) + '-' + d;				
				var keyAcessTime = keyIn + 'access-time'; //key to find access time of a person
				redisClient.lrange(keyAcessTime, 0, -1, function(err, result) {
					if (err) {
						console.log('error: ' + err);
					}
				});
				var multi = redisClient.multi();
				multi.llen(keyAcessTime, function(err, result) {
					if (err) {
						console.log(err);
					}
				});
				multi.lrange(keyAcessTime, 0, -1);
				multi.exec(function(err, result) {
					var inTime = result[1];
					var outTime = result[2];
					var timeSpent = 0;
					for (i = 0; i < result[0]; i+= 2) {
						var bid = inTime[i].split(',');
						var rid = bid[0];
						var time = bid[1].split(':');
						var inTimeSeconds =  +time[0] * 60 + +time[1];
						var temp = inTime[i+1].split(',');
						var outTime = temp[1].split(':');
						var outTimeSeconds = +outTime[0] * 60 + +outTime[1];
						var timeSpent = outTimeSeconds - inTimeSeconds;
						heatMapTime[rid] = heatMapTime[rid] + timeSpent;
					}
				socket.emit('message', heatMapTime);
				socket.emit('title', 'Heat Map From: ' +  fromDate + ' To: ' + toDate);
				});
			}
		}

	})
})

