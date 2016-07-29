# Positioning System

## Overview

This project helps in keeping track of the position of the employees via the ***BLE(Bluetooth Low Energy) Beacons*** which send Bluetooth signals at a constant rate. These signals are then, in turn received by the receivers and sent to the server, which keeps track of the *in-times* and *out-times* of the employees. The position of the employees are visualized by a webpage.

## Information

This folder consists of 2 folders namely **positioning-system-client** and **positioning-system-server**.

**positioning-system-client** folder contains the *client* code for the Positioning System. It consists of an application to be installed in any iOS device of required specifications.The name of the application is namely ***BLETest2***. This iOS application must be installed in any iOS device of required specifications for the device to act as **RECEIVER**.

**positioning-system-server** folder consists of the following files. A brief and concise definition of the files are written right beside them.

* **Assets** is a folder which contains the resources important to the project.
* **employee.csv** is a *csv* file which consists of the mapping between ***employee-id*** and ***beacon-id***.
* **generate-record.js** is a *Node.js* application file which writes the *in-times* and *out-times* of the employees in a csv file.
* **index.html** is an *html* file which helps in the visualization of the employee position corresponding to the various receivers. It helps in keeping track of the employee position at all times.
* **receiver-data** is a *csv* file which gives information about the *receivers* and where they are to be positioned.
* **server.js** is a *Node.Js* application file which starts the server at a particular port,  performs calculations and maintains information about the *in-times* and *out-times* of the employees.

## How to use

The follwing points must be followed in order to start the system.

* Install the application from the **positioning-system-client** folder, install it and run it.
* Change the system directory to the **positioning-system-server**.
* After that, install the various modules required for the server.js file to run. All these modules can be installed via the *package.json* file in the same folder.
 Installation specific information can be found at https://docs.npmjs.com/cli/install.
* Start the redis-server by using the command **redis-cli** in the terminal.
* Run the *server.js* file through the terminal.
* Open the browser and go to http://127.0.0.1:10000/ to visualize the position of the employees.
* When everything is done, run the *generate-record.js* file to write the data into a csv file.




Copyright © UIEvolution, Inc. All Rights Reserved.