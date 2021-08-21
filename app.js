// Initialize server variables
const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const util = require('util');
var siofu = require("socketio-file-upload");
const options = {
	key: fs.readFileSync('./cert/ia.key'),
	cert: fs.readFileSync('./cert/server.crt'),
	ca: fs.readFileSync('./cert/ca.crt')
}

// Create HTTPS server
const server = https.createServer(options, app);
const path = require('path');
const readline = require('readline'); // Command line input
const io = require('socket.io')(server);
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const colors = require('colors');

const spawn = require("child_process").spawn;
let {PythonShell} = require('python-shell')

// Create portf
const serverPort = process.env.PORT || 3029;
server.listen(serverPort, function () {
	console.log('Started an https server on port ' + serverPort);
})
const public = __dirname + '/public/';
app.use(siofu.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/*', function (req, res, next) {
	res.redirect('/')
	next()
})


var scipy = require('scipy');

console.log(scipy)

// Server-client connection architecture
io.on('connection', function(socket) {
	console.log("Connection made", new Date())




    socket.on('sampleTests', function () {

    })

	socket.on('disconnect', function () {

	});
});


module.exports = app;
