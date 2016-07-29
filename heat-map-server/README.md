Installation Guide- 
===================

**Install Client Code-**
------------------------

* Step 1-  Go to  uie-j-project/door-system/door-system-client
* Step 2- Run BLETest2.xcodeproj on Xcode and install it in some iPod
* Step 3- Open the application BLETest2 in the iPod and set their ip address to your server computer and give them different serial number and set it

**Install Server Code-**
------------------------

* Step 1- now go to the Heat Map folder and install node modules by npm
* Step 2- Run the redis server in the default port(type in consol- redis-server) and keep it running in background.

**Install Heatmap server code-**
--------------------------------

* Step 1- Open another terminal and run door.js(node door.js).
It will be automatically connected with the redis server and start receiving details from the iPod and will keep storing all the informations in redis server
* Step 2- Open another terminal and run home.js (node home.js)
* Step 3- Open a browser and go to 127.0.1:8080/

**Important**
--------------

* In Assets folder back.jpg is the map of the indoor
* employee.csv file has a list of employee name and their beacon id from where it makes the form list in the views/home.html program with ejs node module.
* reader.coordinate.csv file has a list of reader id with their position. So whenever you want to any reader in this system, just add them with their reader id and x and y position according to the image(indoor map)
* Currently using local host for email server which is "web1.uievolution.co.jp". But in AWS linux you cant use Gmail or any other mail service. You have to use Amazon SES for that.



Copyright © UIEvolution, Inc. All Rights Reserved.