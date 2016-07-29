//
// Created by Ankur Sardar(ankur.sardar18@gmail.com)
//

var PORT = 10000;
var express = require('express');
var redis = require('redis');
var app = express();

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('Server IP addr: ' + add);
})

var redisClient = redis.createClient();
redisClient.on('connect', function() {
    console.log('redisClient connected');
});

app.get('/', function(req, res) {
    res.send('Hello!');
})

app.get('/rec/:rid/:bid/:time', function(req, res) {
    var rid = req.params.rid; // reader ID
    var bid = req.params.bid; // beacon ID
    var timestamp = new Date();
    console.log(bid);
    var d = timestamp.getDate();  
    var m = timestamp.getMonth() + 1;
    var y = timestamp.getYear() + 1900;
    var h = timestamp.getHours();
    var keyIn = bid + '-' + y + '-' + m + '-' + d; // key to store the in-time of a particular BID
    
    // Storing the In-time details with the key of bid-yy-mm-dd format
    redisClient.exists(keyIn, function(err, reply) {
        if (reply === 1) {
            return;
        }
        else {
            redisClient.set(keyIn, bid + ',' + rid + ',' + h + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds() , function(error, result) {
                if (error) {
                    console.log('Error: ' + error);
                }    
                else { 
                    console.log('In Time Saved: ' , result);
                }
            });

            redisClient.get(keyIn, function(error, result) {
                if (error) {
                    console.log('Error: '+ error);
                }
                else {
                    console.log('In Time Details: ' + result);
                }
            });
        }
    });

    var keyOut = keyIn + '-out'; // key to store out-time of a beacon
    
    // Storing the In-time details with the key of bid-yy-mm-dd'-out' format

    redisClient.set(keyOut, rid + ',' + h + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds() , function(error, result) {
        if (error) { 
            console.log('Error: ' + error);
        }
        else {
            console.log('Out Time Saved: ' , result);
            var response = result;
            res.send(response);
        }
    });

    redisClient.get(keyOut, function(error, result) {
        if (error) {
            console.log('Error: '+ error);
        }
        else { 
            console.log('Last time Details: ' + result);
        }
    }); 
    var keyAcessTime = keyIn + '-access-time';
    redisClient.exists(keyAcessTime, function(err, reply) {
        if (reply === 1) {
            redisClient.rpop(keyAcessTime, function(error, result) {
                if (error) {
                    console.log('Error: '+ error);
                }
                else {
                    var temp = result.split(',');
                    var oldtime = temp[1].split(':');
                    var time = timestamp.getHours() * 60 + timestamp.getMinutes();
                    var oldtimeInMinute = +oldtime[0] * 60 + +oldtime[1];
                    console.log('new vs old time: ' + time + ':' + oldtimeInMinute)
                    var timeDifference = time - oldtimeInMinute;
                    var timeLimit = 2;
                    console.log('timeDifference: ' + timeDifference);
                    if(timeDifference > timeLimit) {  // comparing the time gap with the last value; if the time gap is more than 2 minutes, it will be considered as end time
                        redisClient.rpush(keyAcessTime, result, function(error, b) {
                            if (error) {
                                console.log('out time update error')
                            }

                            else {
                                console.log('push back the in-time pop value: ' + result );
                            }
                        });
                        redisClient.rpush(keyAcessTime, rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes());
                        redisClient.rpush(keyAcessTime, rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes());                       

                    }                       
                    else {
                        redisClient.rpush(keyAcessTime, rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes(), function(err,n) {
                            console.log('new out-timestamp of rid: ' + rid + 'saved');                                
                        });
                  }
               } 
            });                             
        }
        else {
            redisClient.rpush(keyAcessTime,rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes(), function(error, result) {
                if (error) {
                    console.log('Error: ' + error);
                }
                else {
                    console.log('First In Time Saved: ' , result);
                }
            });
            redisClient.rpush(keyAcessTime,rid + ',' + timestamp.getHours() + ':' + timestamp.getMinutes(), function(error, result) {
                if (error) {
                    console.log('Error: ' + error);
                }
                else {
                    console.log('First Out Time Saved: ' , result);
                }          
            });           
        }      
    });
    redisClient.lrange(keyAcessTime, 0, -1, function(err, p) {
        console.log('access-List: ' + p);
    });
});


var server = app.listen(PORT, function() {
    console.log('Server is running at Port ' + PORT);
});
