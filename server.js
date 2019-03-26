var express = require('express');
var app = express();
var httpServer = require('http').Server(app);

app.use(express.static(__dirname + '/public'));

httpServer.listen(7878);

var figures = [];

var WebSocketServer = require("ws").Server;
wss = new WebSocketServer({ port: 9001 });

wss.on('connection', function connection(ws) {
    broadcast(wss.clients.size);
    ws.send(JSON.stringify({ isCanvas: true, objects: figures }));
    ws.on('message', function incoming(message) {
        if (isCanvasMessage(message)) {
            figures = JSON.parse(message).objects;
        } else {
            broadcast(message);
        }
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

function isCanvasMessage(message) {
    try {
        const obj = JSON.parse(message);
        return obj.isCanvas;
    } catch (e) {
        return false;
    }
}