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


var schedule = require('node-schedule');

// set up the schedule, it will run everyday at 23:55 hrs

var rule = new schedule.RecurrenceRule();
rule.hour = 23;
rule.minute = 55;
var j = schedule.scheduleJob(rule, function() {    
    var fs = require('fs');
    var data = fs.readFileSync('employee.csv', 'utf8'); // reading beaconId from a csv file
    var beacon = data.split(/[\r\n]+/);
    var key = [];
    for (i = 0; i < beacon.length; i++) {
        var temp = beacon[i].split(',');
        key[i] = temp[1];
    }

    var timestamp = new Date();
    var d = timestamp.getDate();
    var m = timestamp.getMonth() + 1;
    var y = timestamp.getYear() + 1900;   
    var file_name = y + '-' + m + '-' + d + '.csv';
    var file_name_1 = 'Details-access-time-' + file_name;
    var n = key.length;

    for (i = 0; i < n-1; i ++) {
        // getting the employee_id from the database
        redisClient.get(key[i], function(error, result) {
            if (error) {
                console.log('Error: '+ error);
            }
            else {
                console.log('Details: ' + result);
                var data = fs.appendFile(file_name, result + ',' , 'utf8' , function(error) {
                    if (error) {
                        throw error;
                    }
                    console.log(key + ' Employee Id written');
                });
                var data = fs.appendFile(file_name_1, result + ',', 'utf8', function(error) {
                    if (error) {
                        throw error;
                    }
                    console.log('Employee Id written in both files');
                });
            }
        });

        var key1 = key[i] + '-' + y + '-' + m + '-' + d;
        // Getting the In-time details
        redisClient.get(key1, function(error, result) {
            if (error) {
                console.log('Error: '+ error);
            }
            else {
                console.log('Details: ' + result);
                var data = fs.appendFile(file_name, result + ',' , 'utf8' , function(error) {
                    if (error) {
                        throw error;
                    }
                    console.log(key + ' In time written');
                });
                console.log('First line done');
            }
        });
        // getting the Out-time details
        var key2 = key1 + '-out';
        redisClient.get(key2, function(error, result) {
            if (error) {
                console.log('Error: ' + error);
            }
            else {
                var data = fs.appendFile(file_name, result + '\n' , 'utf8' , function(error) {
                    if (error) { 
                        throw error;
                    }    
                    console.log(key + ' Out Time written');
                });
            }
        });
        // getting the Access Time details
        var key3 = key1 + '-access-time';
        redisClient.lrange(key3, 0, -1, function(err, result) {
            console.log( 'details acess: ' + result);
            var data = fs.appendFile(file_name_1, result + '\n', 'utf8');
        });
    }

    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        host: 'web1.uievolution.co.jp',
        port: 25,
        auth: {
            user: 'mailer',
            pass: '6U8MBKNS'
        }
    });

    var mailOptions = {
        from: 'asardar@uievolution.com',
        to: 'asardar@uievolution.com',
        subject: 'Daily Attandance Sheet',
        text: 'A CSV file is attached with this Email',
        attachments: [ {'path' : file_name}, {'path' : file_name_1} ]                     
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Message Sent: ' + info.response);
        }
    });
});

var server = app.listen(PORT, function() {
    console.log('Server is running at Port ' + PORT);
});
