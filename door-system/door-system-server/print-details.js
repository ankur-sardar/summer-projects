//
// Created by Ankur Sardar(ankur.sardar18@gmail.com)
//

var redis = require('redis');
var redisClient = redis.createClient();
redisClient.on('connect', function() {
    console.log('redisClient connected');
});

var fs = require('fs');
var data = fs.readFileSync('employee.csv', 'utf8'); // reading beaconId from a csv file
var beacon = data.split(/[\r\n]+/);
var key = [];
for(var i = 0; i < beacon.length; i++) {
    var temp = beacon[i].split(',');
    key[i] = temp[1];
}

if (process. argv. length <= 2) {
    console.log("Usage: node print-details.js yyyy-mm-dd");
    process.exit(-1);
}

var temp = process.argv[2].split('-');
var date = temp[0] + '-' + parseInt(temp[1]) + '-' + parseInt(temp[2]);
// Checking the correct date format in arg value
if ( 12 < parseInt(temp[1]) || 31 < parseInt(temp[2])) {
    console.log("To get the information of a particular day-Type a date in this format(yyyy-mm-dd).(e.g. 6th April,206 -> 2016-4-6)");
    process.exit(-1);
}
var file_name = 'entrance-log-' + date + '.csv';
var file_name_1 = 'entrance-log-details-' + date + '.csv';
var n = key.length;
var data = fs.appendFile(file_name, 'Name,Beacon-Id,In-Time,Out-Time \n', 'utf8', function(error) {
    if (error) {
        throw error;
    }
});
console.log('Key: ' + key);
for (i = 0; i < key.length; i ++) {
    // Writing the employee name to the file
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
    // Writing the InTime in the file
    var key1 = key[i] + '-' + date;
    redisClient.get(key1, function(error, result) {
        if (error) {
            console.log('Error: '+ error);
        }
        else if (result === null) {
            var data = fs.appendFile(file_name, ' ,', 'utf8');
        }
        else {
            console.log('Details: ' + result);
            var inTime = result.split(',');
            var data = fs.appendFile(file_name, inTime[0] + ',' + inTime[2] + ',', 'utf8' , function(error) {
                if (error) {
                    throw error;
                }
                console.log(key + ' In time written');
            });
            console.log('First line done');
        }
    });
    // Writing the OutTime in the file    
    var key2 = key1 + '-out';
    redisClient.get(key2, function(error, result) {
        if (error) {
            console.log('Error: ' + error);
        }
        else if (result === null) {
            var data = fs.appendFile(file_name, '\n', 'utf8');
        }
        else {
            var outTime = result.split(',');
            var data = fs.appendFile(file_name, outTime[1] + '\n' , 'utf8' , function(error) {
                if (error) {
                    throw error;
                }
                console.log(key + ' Out Time written');
            });
        }
    });
    // Writing Detailed door access time in file
    var key3 = key1 + '-access-time';
    redisClient.lrange(key3, 0, -1, function(err, result) {
        console.log( 'details acess: ' + result);
        var data = fs.appendFile(file_name_1, result + '\n', 'utf8');
    });
}
// Sending Email with two files attachment
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
    subject: 'Daily Entrance Log',
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
redisClient.quit();
