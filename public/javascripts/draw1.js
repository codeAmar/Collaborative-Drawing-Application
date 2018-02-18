var path, pointX, pointY;
var initialPointRect, initialPointTri, initialPointCir, initialPointPen, initialPointBrush, intialSizeTri = 50;
var rectngle, triangle, circle, pen;
var rectangleDrawn = false;
var isPenDrawing = false;
var isBrushDrawing = false;
var cpyarr;
var initialPointPenCopy;
var path_to_send = {};

var brushPathObj = {};

var colors = document.querySelectorAll('div.color-pallet');
var tools = document.querySelectorAll('div.tool-pallet');

tool.minDistance = 10;
tool.maxDistance = 45;

var uid = (function () {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}());


var current = {
    color: 'black',
    tool: 'pen'
}

colors.forEach(function (element) {
    element.style.backgroundColor = element.className.split(' ')[0];
    element.addEventListener('click', function (event) {
        if (event.type === 'click') {
            current.color = event.target.className.split(' ')[0];
            console.log(current.color);
        }
    });
});

tools.forEach(function (element) {
    element.addEventListener('click', function (event) {
        if (event.type === 'click') {
            current.tool = event.target.className.split(' ')[0];
            console.log(current.tool);
        }
    });
});



function randomColor() {
    return {
        red: 0,
        green: Math.random(),
        blue: Math.random(),
        alpha: (Math.random() * 0.25) + 0.05
    };
}

function onMouseDown(event) {
    view.draw();
    switch (current.tool) {
        case 'line':
            path = new Path();
            path.strokeColor = current.color;
            path.strokeWidth = 5;
            pointX = event.point;
            console.log('point x is ' + pointX + "event.point is " + event.point);
            path.add(event.point);
            break;
        case 'rectangle':
            initialPointRect = new Point(event.point);
            console.log('event.point ' + event.point);
            console.log('initial rect point ' + initialPointRect);
            break;
        case 'triangle':
            initialPointTri = new Point(event.point);
            break;
        case 'circle':
            initialPointCir = new Point(event.point);
            break;
        case 'pen':
            initialPointPen = new Path();
            initialPointPen.strokeColor = current.color;
            initialPointPen.add(event.point);
            isPenDrawing = true;
            path_to_send = {
                start: {
                    "x": event.point.x,
                    "y": event.point.y
                },
                path: []
            };
            break;
        case 'brush':
            initialPointBrush = new Path();
            mouseDownDrawBrush(initialPointBrush, event);
            break;
        default:
            console.log('unknown switch statement');
            break;
    }
}

function onMouseDrag(event) {
    if (isPenDrawing) {
        mouseDragDrawPen(event);
    }
    if (isBrushDrawing) {
        mouseDragDrawBrush(event);
    }
}

function mouseDragDrawPen(event) {
    console.log('event.point mousedrag ', event.point.x, event.point.y);
    initialPointPen.add(event.point);
    path_to_send.path.push({
        x: event.point.x,
        y: event.point.y
    });
}





function onMouseUp(event) {
    var rectangleSize, rectPath;

    switch (current.tool) {

        case 'line':
            pointY = event.point;
            console.log("point y is " + pointY + "event.point is " + event.point);
            path.add(event.point);
            view.draw();
            emitLine(pointX, pointY, current.color);
            break;

        case 'rectangle':
            rectangleSize = (new Point(event.point)) - initialPointRect;
            rectPath = new Rectangle(initialPointRect, rectangleSize);
            rectangle = new Path.Rectangle(rectPath);
            rectangle.fillColor = current.color;
            rectangle.selected = true;
            rectangleDrawn = true;
            emitRect(initialPointRect, rectangleSize);
            console.log('rectangle layer' + rectangle.layer);
            break;
        case 'triangle':
            triangle = new Path.RegularPolygon(initialPointTri, 3, intialSizeTri);
            triangle.fillColor = current.color;
            triangle.selected = true;
            emitTri(initialPointTri, 3, intialSizeTri);
            break;
        case 'circle':
            circle = new Path.Circle(initialPointCir, 60);
            circle.strokeColor = 'black';
            circle.fillColor = current.color;
            emitCir(initialPointCir, 60);
            break;
        case 'pen':
            mouseUpDrawPen(event);
            break;
        case 'brush':
            isBrushDrawing = false;
            MouseUpDrawBrush(event);
            break;
        default:
            console.log('unknown switch statement');
            break;
    }
    if (rectangleDrawn) {
        rectangle.onMouseEnter = function (event) {
            this.fillColor = 'cyan';
        }
        rectangle.onMouseLeave = function (event) {
            this.fillColor = current.color;
        }
        rectangle.onMouseDrag = function (event) {
            rectangle.position += event.delta;
        }
    }

}



function mouseUpDrawPen(event) {
    isPenDrawing = false;
    initialPointPen.add(event.point);
    initialPointPen.closed = false;
    initialPointPen.smooth();
    console.log('whole pen path ', initialPointPen);
    path_to_send.end = {
        "x": event.point.x,
        "y": event.point.y
    };
    io.emit('drawPens', JSON.stringify(path_to_send));
    path_to_send.path = new Array();
}



function mouseDownDrawBrush(initialPointBrush, event) {
    initialPointBrush.fillColor = current.color;
    initialPointBrush.add(event.point);
    console.log('brush path mouse pressed positions' + initialPointBrush.position);
    isBrushDrawing = true;
    brushPathObj = {
        start: {
            "x": event.point.x,
            "y": event.point.y
        },
        events: [],
        end: {}
    };
}

function mouseDragDrawBrush(event) {
    console.log('brush path drag positions' + initialPointBrush.position);
    var step = event.delta / 2;
    step.angle += 90;
    var top = event.middlePoint + step;
    var bottom = event.middlePoint - step;
    console.log('top', top);
    console.log('bottom', bottom);

    initialPointBrush.add(top);
    initialPointBrush.insert(0, bottom);
    initialPointBrush.smooth();
    brushPathObj.events.push({
        "top": top,
        "bottom": bottom,
    });

}


function MouseUpDrawBrush(event) {
    isBrushDrawing = false;
    initialPointBrush.add(event.point);
    initialPointBrush.closed = true;
    initialPointBrush.smooth();
    brushPathObj.end = {
        "x": event.point.x,
        "y": event.point.y
    };
    io.emit('drawBrushs', JSON.stringify(brushPathObj));
    brushPathObj.events = new Array();
}



function emitLine(x, y, color) {
    var data = {
        x: x,
        y: y,
        color: color
    };
    io.emit('drawLine', data);
}

function emitRect(points, size) {
    var data = {
        x: points.x,
        y: points.y,
        width: size.x,
        height: size.y
    };
    io.emit('drawRect', data);
}

function emitCir(points, size) {
    var data = {
        x: points.x,
        y: points.y,
        size: size
    }
    io.emit('drawCir', data);
}

function emitTri(points, corners, size) {
    var data = {
        points: points,
        corners: corners,
        size: size
    }
    io.emit('drawTri', data);
}

function emitBrush(path) {
    io.emit('drawBrush', path);
}

function emitPen(path) {
    console.log('emit pen ' + path);
    io.emit('drawPen', path);
}



io.on('drawLine', function (data) {
    var myPath = new Path();
    myPath.strokeColor = data.color;
    myPath.strokeWidth = 5;
    myPath.add(new Point(data.x[1], data.x[2]));
    myPath.add(new Point(data.y[1], data.y[2]));
    view.draw();
})

io.on('drawRect', function (data) {
    var myRectangle = new Rectangle(new Point(data.x, data.y), new Point(data.width, data.height));
    var myRectPath = new Path.Rectangle(myRectangle);
    myRectPath.fillColor = current.color;
    myRectPath.selected = true;

})

io.on('drawCir', function (data) {
    var myCircle = new Path.Circle(new Point(data.x, data.y), data.size);
    myCircle.fillColor = current.color;
})

io.on('drawTri', function (data) {
    console.log('data recieved : ', data);
    var emittedTriangle = new Path.RegularPolygon(new Point(data.points[1], data.points[2]), data.corners, data.size);
    emittedTriangle.fillColor = current.color;
    emittedTriangle.selected = true;
    console.log('emitted triangle  : ', emittedTriangle);
    view.draw();
})


io.on('drawBrushs', function (paths) {
    view.draw();
    var brushSegments = JSON.parse(paths);
    console.log(brushSegments);
    var BrushPaths = new Path();
    BrushPaths.fillColor = current.color;
    BrushPaths.add(new Point(brushSegments.start.x, brushSegments.start.y));
    var brushDragPaths = brushSegments.events.forEach(function (element) {
        var segment_arr_top = element.top.slice(1);
        var segment_arr_bottom = element.bottom.slice(1);
        BrushPaths.add(new Point(segment_arr_top[0], segment_arr_top[1]));
        BrushPaths.insert(0, new Point(segment_arr_bottom[0], segment_arr_bottom[1]));
        BrushPaths.smooth();
    });
    BrushPaths.add(new Point(brushSegments.end.x, brushSegments.end.y));
    BrushPaths.closed = true;
    BrushPaths.smooth();
    console.log('drawbrushs ', path);
})


io.on('drawPens', function (paths) {
    var paths = JSON.parse(paths);
    var emitPen = new Path();
    emitPen.add(new Point(paths.start.x, paths.start.y));
    emitPen.strokeColor = current.color;
    console.log('paths', paths);
    var myresuolt = paths.path.forEach(function (item) {
        emitPen.add(new Point(item.x, item.y));
    });
    console.log(myresuolt);
    emitPen.add(new Point(paths.end.x, paths.end.y));
    console.log('emitPen ', emitPen);
    view.draw();
})