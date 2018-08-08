/*
broadlink node.js
Derived from
Dave Gutheinz's TP-LinkHub - Version 1.0
*/

//##### Options for this program ###################################
var logFile = "no"    //    Set to no to disable error.log file.
var hubPort = 8083    //    Synched with Device Handlers.
//##################################################################

//---- Determine if old Node version, act accordingly -------------
console.log("Node.js Version Detected:   " + process.version)
var oldNode = "no"
if (process.version == "v6.0.0-pre") {
    oldNode ="yes"
    logFile = "no"
}

//---- Program set up and global variables -------------------------
var http = require('http')
var net = require('net')
var fs = require('fs')
const BroadlinkDevice = require('broadlink-js-smth')

var server = http.createServer(onRequest)

//---- Start the HTTP Server Listening to SmartThings --------------
server.listen(hubPort)
console.log("broadlink smartthings bridge Console Log")
logResponse("\n\r" + new Date() + "\rbroadlink smarrhings bridge Error Log")

//---- Command interface to Smart Things ---------------------------
function onRequest(request, response){
    var command =     request.headers["command"]
    var deviceIP =     request.headers["devip"]
    
    var cmdRcvd = "\n\r" + new Date() + "\r\nIP: " + deviceIP + " sent command " + command
    console.log(" ")
    console.log(cmdRcvd)
        
    switch(command) {
        //---- TP-Link Device Command ---------------------------
        case "deviceCommand":
            processDeviceCommand(request, response)
            break
    
        default:
            response.setHeader("cmd-response", "InvalidHubCmd")
            response.end()
            var respMsg = "#### Invalid Command ####"
            var respMsg = new Date() + "\n\r#### Invalid Command from IP" + deviceIP + " ####\n\r"
            console.log(respMsg)
            logResponse(respMsg)
    }
}

//---- Send deviceCommand and send response to SmartThings ---------
function processDeviceCommand(request, response) {
    
    var deviceIP = request.headers["devip"]
    var command =  request.headers["devcommand"]
    var dps = request.headers["dps"]

    var respMsg = "deviceCommand sending to IP: " + deviceIP + " Command: " + command
    console.log(respMsg)

    var blink = new BroadlinkDevice();
    blink.discover(null, [deviceIP]);

    blink.on("deviceReady", function(dev) {
        console.log("typeof mac >>> "+dev.mac);
        console.log(">>>>>>>>>>>>>>>find dev ip=" + dev.host.address +" type="+dev.type);

	dev.on("power", function(status) {
            console.log("receive check_power : " + status);
            response.setHeader("cmd-response", status);
	    response.end();
	});

	dev.on("done", function() {
            console.log("receive set_power");
	    this.check_power();
	});

	switch(command) {
	    case "on":
		dev.set_power(true);
		break;

	    case "off":
		dev.set_power(false);
		break;
        
	    case "status":
		dev.check_power();
		break;

            default:
                console.log('Unknown request');
	        break;
	}
        blink.discover(null,[]);
    });
}

//----- Utility - Response Logging Function ------------------------
function logResponse(respMsg) {
    if (logFile == "yes") {
        fs.appendFileSync("error.log", "\r" + respMsg)
    }
}
