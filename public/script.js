window.addEventListener('load', init);

function init() {
    initServer();
    canvas = new fabric.Canvas('canvas', { selection: true });
    canvas.freeDrawingBrush.color = 'green';
    canvas.freeDrawingBrush.lineWidth = 10;

    addCircle.addEventListener('click', addCircleHandler);
    addRectangle.addEventListener('click', addRectangleHandler);
    addTriangle.addEventListener('click', addTriangleHandler);
    pencil.addEventListener('click', pencilHandler);
    select.addEventListener('click', selectHandler);
    canvas.on({
        'path:created': pathCreatedHandler,
        'object:modified': objectModifiedHandler
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
        id: generateId(),
        radius: 20,
        fill: 'green',
        left: 100,
        top: 100
    };
    sendObject('circle', circle);
}

function addRectangleHandler() {
    var rectangle = {
        id: generateId(),
        top: 100,
        left: 100,
        width: 60,
        height: 70,
        fill: 'red'
    };
    sendObject('rectangle', rectangle);
}

function addTriangleHandler() {
    var triangle = {
        id: generateId(),
        width: 20,
        height: 30,
        fill: 'blue',
        left: 50,
        top: 50
    };
    sendObject('triangle', triangle);
}

function pencilHandler() {
    canvas.isDrawingMode = true;
}

function selectHandler() {
    canvas.isDrawingMode = false;
}

function pathCreatedHandler(event) {
    const id = generateId();
    event.path.set('id', id);
    sendObject('path', {
        id: id,
        ...event.path
    });
}

function generateId() {
    return canvas._objects.length;
}

function objectModifiedHandler(event) {
    const obj = {
        id: canvas.getActiveObject().get('id'),
        ...event
    };
    websocket.send(JSON.stringify({ 'modified': true, type: event.type, data: obj }));
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
        if (typeof obj == 'number') {
            clientCounter.innerHTML = obj;
        } else {
            var data;
            var type;
            if (obj.modified) {
                data = { id: obj.data.id, ...obj.data.target };
                type = obj.data.target.type;
                canvas.remove(canvas._objects[obj.data.id]);
            } else {
                data = obj.data;
                type = obj.type;
            }
            addObject(type, data);
        }
    }
}

function addObject(type, obj) {
    if (!canvas._objects.some(o => o.get('id') == obj.id)) {
        var shape;
        if (type == 'triangle') {
            shape = new fabric.Triangle(obj);
        } else if (type == 'rectangle') {
            shape = new fabric.Rect(obj);
        } else if (type == 'circle') {
            shape = new fabric.Circle(obj);
        } else if (type == 'path') {
            shape = new fabric.Path(obj.path, obj);
        }
        shape.set('id', obj.id);
        canvas.add(shape);
    }
}

function sendObject(type, obj) {
    websocket.send(JSON.stringify({ 'type': type, 'data': obj }));
}