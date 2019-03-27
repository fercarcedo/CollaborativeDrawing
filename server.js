var express = require('express');
var app = express();
var httpServer = require('http').Server(app);
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var User = require('./models/user');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'my-secret',
    resave: true,
    saveUninitialized: false
}));

app.use('/protected/*', requireLogin);
app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://miwDCMW:' + encodeURIComponent('.xq$ACDFEK.2AuQ7BGtyhg8PO') + '@ds147225.mlab.com:47225/collaborativedrawing')
    .then(res => console.log('Connected to DB'))
    .catch(console.log);

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

function requireLogin(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

app.post('/signup', function (req, res) {
    if (req.body.email && 
        req.body.username &&
        req.body.password &&
        req.body.passwordConfirmation) {

        const userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            passwordConfirmation: req.body.passwordConfirmation
        };
        
        User.create(userData, function (err, user) {
            if (err) {
                return next(err);
            } else {
                req.session.loggedIn = true;
                return res.redirect('/');
            }
        });
    }
});

app.post('/login', function (req, res) {
    if (req.body.username && 
        req.body.password) {
        
        User.authenticate(req.body.username, req.body.password, function (err, user) {
            if (err || !user) {
                return res.redirect('/login.html');
            } else {
                req.session.loggedIn = true;
                return res.redirect('/');
            }
        });
    }
});

app.get('/logout', function (req, res, next) {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    }
});

app.get('/', requireLogin, function (req, res) {
    res.sendFile(__dirname + '/public/protected/index.html');
});