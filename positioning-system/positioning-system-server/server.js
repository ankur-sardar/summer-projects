//
//Created by Kartik Singh
//

var PORT = 10000;

var express = require('express');
var fs = require('fs');
var redis = require('redis');
var path = require('path');

var app = express();

var outOfRangeInterval = 2000;
var deadDuration = 5;
var rssiGap = 5;
var bids = [];
var timeLastReceived = {};
var rssiLastReceived = {};

var server = app.listen(PORT, function() {
    console.log('Server is running at Port ' + PORT);
});

require('dns').lookup(require('os').hostname(), function(err, add, fam) {
    console.log('Server IP addr: ' + add);
})
var redisClient = redis.createClient();
redisClient.on('connect', function() {
    console.log('redisClient connected');
});

app.use(express.static (__dirname + '/Assets'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

fs.readFile('Employee.csv','utf8',function(error,data) {
    if (error) {
        console.log(error);
    }
    else {
        var lines = data.split(/\r\n/);
        console.log(lines);
        for (var i in lines) {
        (function(i) {
            var line = lines[i].split(',');
            var eid = line[0];
            var bid = line[1];
            bids.push(bid);
            rssiLastReceived[bid] = 0;
            redisClient.set(bid,eid,function(error,reply) {
                console.log('set: ' + reply);
            });
        })(i);

        }
    }
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
    console.log('A client is connected!');
    app.get('/rec/:rid/:bid/:rssi', function(req, res) {
        var rid = req.params.rid;
        var bid = req.params.bid;
        var timestamp = new Date();
        var rssi = req.params.rssi;
        var d = timestamp.getDate();
        var m = timestamp.getMonth() + 1;
        var y = timestamp.getYear() + 1900;
        var exactTime = new Date(0);
        var secondsM = new Date() / 1000;
        console.log(timestamp.getSeconds());
        redisClient.get(bid, function(err, eid) {
          console.log("REPLY", eid);
          var key = eid + '-' + y + '-' + m + '-' + d;
          console.log(key);
          redisClient.exists(key, function(err, reply) {
              redisClient.rpop(key, function(error, val) {
                  if (reply === 1 && val != 'null') {
                      if (error) {
                          console.log(error);
                      } else {
                          console.log('Hello', val[0]);
                          if (!isNaN(val[0])) {
                              if (rid === val[0]) {
                                  redisClient.rpush([key, val], function(error, reply) {
                                      if (error) {
                                          console.log(error);
                                      } else {
                                             timeLastReceived[bid] = rid + '+' + secondsM;
                                             rssiLastReceived[bid] = rssi;
                                             socket.emit('RID+EID', rid + '+' + eid);
                                             redisClient.lrange(key, 0, -1, function(err, reply) {
                                                 console.log(rssiLastReceived[bid], "I am rssiLastReceived");
                                                 console.log(reply);
                                              });
                                        }
                                  });

                              } else {
                                redisClient.rpush([key, val], function(error, reply) {
                                    if (error) {
                                        console.log(error);
                                    }
                                });
                                if (rssi - rssiLastReceived[bid] > rssiGap) {
                                    console.log(timeLastReceived[bid]);
                                    var temp2 = timeLastReceived[bid].split('+');
                                    exactTime.setUTCSeconds(temp2[1]);
                                    redisClient.rpush([key, 'out , ' + exactTime.getHours() + ':' + exactTime.getMinutes() + ':' + exactTime.getSeconds()], function(error, reply) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                              redisClient.lrange(key, 0, -1, function(err, reply) {
                                              });
                                          }
                                    });
                                    redisClient.rpush([key, rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds()], function(error, reply) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                              timeLastReceived[bid] = rid + '+' + secondsM;
                                              rssiLastReceived[bid] = rssi;
                                              redisClient.lrange(key, 0, -1, function(err, reply) {
                                                  console.log(reply);
                                              });
                                          }
                                    });
                                    socket.emit('RID+EID', rid + '+' + eid);
                                } else {
                                      socket.emit("response", "");
                                  }
                              }
                          } else {
                                redisClient.rpush([key, val], function(error, reply) {
                                    if (error) {
                                        console.log(error);
                                    } 
                                });
                                redisClient.rpush([key, rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds()], function(errorB, reply) {
                                    if (errorB) {
                                        console.log(errorB);
                                    } else {
                                          rssiLastReceived[bid] = rssi;
                                          timeLastReceived[bid] = rid + '+' + secondsM;
                                          console.log(rssiLastReceived[bid] + "I am rssiLastReceived");
                                          redisClient.lrange(key, 0, -1, function(err, reply) {
                                              console.log(reply);
                                          });
                                          socket.emit('RID+EID', rid + '+' + eid);
                                      }
                                });
                            }
                        }
                    } else {
                          redisClient.rpush([key, rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds()], function(errorB, reply) {
                              if (errorB) {
                                  console.log(errorB);
                              } else {
                                    timeLastReceived[bid] = rid + '+' + secondsM;
                                    rssiLastReceived[bid] = rssi;
                                    console.log(rssiLastReceived[bid], "I am rssiLastReceived");
                                    redisClient.lrange(key, 0, -1, function(err, reply) {
                                        console.log(reply);
                                    });
                                    socket.emit('RID+EID', rid + '+' + eid);
                                }
                          });
                      }
                  });
              });
          });
          res.send("Hello");
    });

    setInterval(outOfRange, outOfRangeInterval);
	  function outOfRange() {
        for (var i = 0; i < bids.length; i++) {
        (function(i) {
            var timestampLocal = new Date();
            var seconds = timestampLocal.getTime() / 1000;
            var d = timestampLocal.getDate();
            var m = timestampLocal.getMonth() + 1;
            var y = timestampLocal.getYear() + 1900;
            redisClient.get(bids[i], function(err, eid) {
                var fakeKey = eid + '-' + y + '-' + m + '-' + d;
                if(typeof timeLastReceived[bids[i]] !== 'undefined') {
                    var temp = timeLastReceived[bids[i]].split('+');
                    if (seconds - temp[1] >= deadDuration) {
                        var exactTime = new Date(0);
                        exactTime.setUTCSeconds(temp[1]);
                        rssiLastReceived[bids[i]] = 0;
                        redisClient.rpush([fakeKey, 'out ,' + exactTime.getHours() + ':' + exactTime.getMinutes() + ':' + exactTime.getSeconds()], function(error, reply) {
                            if (error) {
                                console.log(error);
                            } else {
                                  console.log("DONE");
                                  socket.emit('RID+EID', -1 + '+' + eid);
                              }
                        });
                    } else {
                          socket.emit("response", "");
                          return;
                   }
                }
            });
       })(i);
       }
    }
});

