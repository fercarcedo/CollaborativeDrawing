window.addEventListener('load', init);

function init() {
    initServer();
    canvas = new fabric.Canvas('canvas');
    canvas.freeDrawingBrush.color = 'green';
    canvas.freeDrawingBrush.lineWidth = 10;

    addCircle.addEventListener('click', addCircleHandler);
    addRectangle.addEventListener('click', addRectangleHandler);
    addTriangle.addEventListener('click', addTriangleHandler);
    pencil.addEventListener('click', pencilHandler);
    canvas.on({
        'path:created': pathCreatedHandler
    });
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function addCircleHandler() {
    var circle = {
        radius: 20,
        fill: 'green',
        left: 100,
        top: 100
    };
    sendObject('Circle', circle);
}

function addRectangleHandler() {
    var rectangle = {
        top: 100,
        left: 100,
        width: 60,
        height: 70,
        fill: 'red'
    };
    sendObject('Rectangle', rectangle);
}

function addTriangleHandler() {
    var triangle = {
        width: 20,
        height: 30,
        fill: 'blue',
        left: 50,
        top: 50
    };
    sendObject('Triangle', triangle);
}

function pencilHandler() {
    canvas.isDrawingMode = true;
}

function pathCreatedHandler(event) {
    sendObject('Path', event.path);
}

function initServer() {
    websocket = new WebSocket('ws://localhost:9001');
    websocket.onopen = connectionOpen;
    websocket.onmessage = onMessageFromServer;
}

function connectionOpen() {
    websocket.send('connection open');
}

function onMessageFromServer(message) {
    console.log('received ' + message);
    if (isJson(message.data)) {
        var obj = JSON.parse(message.data);
        console.log("got data from server");
        addObject(obj.type, obj.data);
    }
}

function addObject(type, obj) {
    var shape;
    if (type == 'Triangle') {
        shape = new fabric.Triangle(obj);
    } else if (type == 'Rectangle') {
        shape = new fabric.Rect(obj);
    } else if (type == 'Circle') {
        shape = new fabric.Circle(obj);
    } else if (type == 'Path') {
        shape = new fabric.Path(obj.path, obj);
    }
    canvas.add(shape);
}

function sendObject(type, obj) {
    websocket.send(JSON.stringify({ 'type': type, 'data': obj }));
}