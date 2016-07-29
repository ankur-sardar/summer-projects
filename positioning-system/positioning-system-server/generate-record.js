//
// Created by Ankur Sardar(ankur.sardar18@gmail.com)
// Modified by Kartik Singh
//

var redis = require('redis');
var fs = require('fs');

var timestamp = new Date();
var d = timestamp.getDate();
var m = timestamp.getMonth()+1;
var y = timestamp.getYear()+1900;

var redisClient = redis.createClient();
redisClient.on('connect', function() {
    console.log('redisClient connected');
});

var file_name = 'positional-record-' + y + '-' + m + '-' + d + '.csv';

var contents = fs.readFileSync('employee.csv','utf8');

var ekey = [];
var lines = contents.split(/[\r\n]+/);
console.log(lines);
for (var i in lines) {
  (function(i) {
    var line = lines[i].split(',');
    var eid = line[0];
    var bid = line[1];
    ekey.push(eid);
  })(i);
}

record(ekey);

function record(ekey) {
  for(var i = 0; i < ekey.length; i++) {
    (function(i) {
     var key = ekey[i] + '-' + y + '-' + m + '-' + d;
        redisClient.lrange(key, 0, -1, function (error, items) {
          fs.appendFile(file_name, key + ',' , 'utf8');
          items.forEach(function (item) {
               fs.appendFile(file_name, item + ',' , 'utf8');
          })
          fs.appendFile(file_name,'\n','utf8');
          console.log(key + " In time written");
        });
    })(i);
  }
}
redisClient.quit();
