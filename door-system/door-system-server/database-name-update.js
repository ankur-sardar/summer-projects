//
// Created by Ankur Sardar(ankur.sardar18@gmail.com)
//

if (process. argv. length <= 2) {
    console.log("Usage: node database-name-update.js File_Name.csv");
    process.exit(-1);
}
var file_name = process.argv[2];
var temp = file_name.split('.');
if ( temp[1] != 'csv' ) {
    console.log("Please Type correct File_Name format( e.g. 'node database-name-update.js employee.csv')");
    process.exit(-1);
}
var redis = require('redis');
var fs = require('fs');

 // reading beaconId from a csv file
var data = fs.readFileSync(file_name, 'utf8', function(error) { 
    if (error) {
        console.log('Error: ' + error);
    }
});
var beacon = data.split(/[\r\n]+/);
var key = [];
var name = [];
for(var i = 0; i < beacon.length; i++) {
    var temp = beacon[i].split(',');
    key[i] = temp[1];
    name[i] = temp[0];
}
var redisClient = redis.createClient();
redisClient.on('connect', function() {
    console.log('redisClient connected');
});
for(i = 0; i < beacon.length; i++) {
    // Saving name as a value and beacon Id as a key in redis server
    redisClient.set(key[i], name[i] , function(error, result) { 
        if (error) {
            console.log('Error1: ' + error);
        }
        else {
            console.log('Name Saved: ' + result);
        }
    });
    console.log(key[i] + ' Key Updated with the Name: ' + name[i]);
}

redisClient.quit();
