Installation Guide- 
===================

**Install Client Code-**
------------------------

* Step 1-  Go to  uie-j-project/door-system/door-system-client
* Step 2- Run BLETest2.xcodeproj on Xcode and install it in some iPod
* Step 3- Open the application BLETest2 in the iPod and set their ip address to your server computer and give them different serial number and put it in the doors.

**Install Server Code-**
------------------------

* Step 1- now go to the uie-j-project/door-system-server folder and install node modules (by npm install)
* Step 2- Run the redis server in the default port(type in consol- redis-server) and keep it running in background.
* Step 3- Open another terminal and run door.js(node door.js).
It will be automatically connected with the redis server and start receiving details from the iPod and will keep storing all the informations in redis server.

**Important**
--------------

* employee.csv file has a list of employee name and their beacon id.
* Every day at 23:55 hrs it will sending two csv file of entrance log. 'entrance-log-date' and entrance-log-details-date'.
* Currently using "web1.uievolution.co.jp" as an email server in local network. But if we try to send the email through internet in different network through AWS linux, you can't use Gmail or any other mail service. You have to use Amazon SES for that.

**Get information for a particular date**
-----------------------------------------

* Go to uie-j-project/door-system/door-system-server/
* Then type in the console **'node print-details.js yyyy-mm-dd'** You have to pass the date as an argument value in console. **Remeber, input should be in this format- yyyy-mm-dd (e.g. 6th April,2016 -> 2016-4-6).** It will create files with the input date name and also send an email to you particular given email address which is mentioned in the code.
* Run the uie-j-project/door-system/door-system-server/print-details.js. It will ask for a input date in console. **Remeber, input should be in this format- 'yyyy-m-d' (You should not put any zero as prefix in month or date. e.g. 6th April,2016 -> 2016-4-6).** It will create files with the input date name and also send an email to you particular given email address which is mentioned in the code.

**Update name with the beacon id in the server**
------------------------------------------------

* Go to uie-j-project/door-system/door-system-server/
* Add a csv file with the details of name and beacon id. **File formate should be like this: 'name,beacon id \n'.** Remember, every entry should be seperated by enter(\n) and there is no space(\b) between name and beacon id. 
* Then type in console **'node database-name-update.js File_Name.csv'**. ( Put the file name in place of 'File_Name')


Copyright © UIEvolution, Inc. All Rights Reserved.
