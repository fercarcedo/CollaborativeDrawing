var express = require('express');
var app = express();
var httpServer = require('http').Server(app);

app.use(express.static(__dirname + '/public'));

httpServer.listen(7878);

var WebSocketServer = require("ws").Server;
wss = new WebSocketServer({ port: 9001 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        wss.clients.forEach(function each(client) {
            client.send(message);
        });
    });
});