var express = require('express');
var app = express();
var httpServer = require('http').Server(app);

app.use(express.static(__dirname + '/public'));

httpServer.listen(7878);

var WebSocketServer = require("ws").Server;
wss = new WebSocketServer({ port: 9001 });

wss.on('connection', function connection(ws) {
    broadcast(wss.clients.size);
    ws.on('message', function incoming(message) {
        broadcast(message);
    });
    ws.on('close', function closed (id) {
        broadcast(wss.clients.size);
    });
});

function broadcast(message) {
    wss.clients.forEach(function each(client) {
        client.send(message);
    });
}