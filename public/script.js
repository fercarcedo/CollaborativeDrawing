window.addEventListener('load', init);

function init() {
    initServer();
    const parent = document.getElementById('card');
    canvas = new fabric.Canvas('canvas', { selection: true, width: parent.offsetWidth, height: parent.offsetHeight });
    canvas.freeDrawingBrush.color = 'green';
    canvas.freeDrawingBrush.lineWidth = 10;

    addCircle.addEventListener('click', addCircleHandler);
    addRectangle.addEventListener('click', addRectangleHandler);
    addTriangle.addEventListener('click', addTriangleHandler);
    pencil.addEventListener('click', pencilHandler);
    select.addEventListener('click', selectHandler);
    downloadJSON.addEventListener('click', downloadJSONHandler);
    canvas.on({
        'path:created': pathCreatedHandler,
        'object:modified': objectModifiedHandler
    });
    window.onresize = function (e) {
        const parent = document.getElementById('card');
        canvas.setWidth(parent.offsetWidth);
        canvas.setHeight(parent.offsetHeight);
        canvas.calcOffset();
    };
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
    sendObject('rect', rectangle);
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

function downloadJSONHandler() {
    const json = getCanvasJSON();
    const linkEl = document.createElement('a');
    linkEl.setAttribute('href', "data:text/json;charset=utf-8," + encodeURIComponent(json));
    linkEl.setAttribute('download', 'canvas.json');
    linkEl.click();
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
    let maxId = -1;
    for (let obj of canvas._objects) {
        if (obj.id > maxId) {
            maxId = obj.id;
        }
    }
    return maxId + 1;
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
    if (isJson(message.data)) {
        var obj = JSON.parse(message.data);
        if (typeof obj == 'number') {
            clientCounter.innerHTML = obj;
        } else if (obj.isCanvas) {
            for (let shape of obj.objects) {
                addObject(shape.type, shape);
            }
        } else {
            var data;
            var type;
            if (obj.modified) {
                data = { id: obj.data.id, ...obj.data.target };
                type = obj.data.target.type;
                canvas._objects.filter(o => o.id == obj.data.id).forEach(e => canvas.remove(e));
            } else {
                data = obj.data;
                type = obj.type;
            }
            addObject(type, data);
            sendCanvasToServer();
        }
    }
}

function addObject(type, obj) {
    if (!canvas._objects.some(o => o.get('id') == obj.id)) {
        var shape;
        if (type == 'triangle') {
            shape = new fabric.Triangle(obj);
        } else if (type == 'rect') {
            shape = new fabric.Rect(obj);
        } else if (type == 'circle') {
            shape = new fabric.Circle(obj);
        } else {
            shape = new fabric.Path(obj.path, obj);
        }
        shape.set('id', obj.id);
        canvas.add(shape);
    }
}

function sendObject(type, obj) {
    websocket.send(JSON.stringify({ 'type': type, 'data': obj }));
}

function sendCanvasToServer() {
    websocket.send(JSON.stringify({ isCanvas: true, objects: getCanvasObjects() }));
}

function getCanvasObjects() {
    let result = [];
    for (let obj of canvas._objects) {
        result.push({
            id: obj.get('id'),
            ...obj
        });
    }
    return result;
}

function getCanvasJSON() {
    return JSON.stringify(canvas._objects);
}