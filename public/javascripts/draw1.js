var path, pointX, pointY;
var initialPointRect, initialPointTri, initialPointCir, initialPointPen, initialPointBrush, intialSizeTri = 50;
var rectangle, triangle, circle, pen;
var rectangleDrawn = false;
var isPenDrawing = false;
var isBrushDrawing = false;
var cpyarr;
var initialPointPenCopy;

var colors = document.querySelectorAll('div.color-pallet');
var tools = document.querySelectorAll('div.tool-pallet');



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
    // element.style.backgroundColor = element.className.split(' ')[0];
    element.addEventListener('click', function (event) {
        if (event.type === 'click') {
            current.tool = event.target.className.split(' ')[0];
            console.log(current.tool);
        }
    })
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
            isPenDrawing = true;
            break;
        case 'brush':
            initialPointBrush = new Path();
            mouseDownDrawBrush(initialPointBrush);
            break;
        default:
            console.log('unknown switch statement');
            break;
    }
}

function onMouseDrag(event) {
    if (isPenDrawing) {
        initialPointPen.add(event.point);
    }
    if (isBrushDrawing) {
        mouseDragDrawBrush(event);
    }
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
            break;
        case 'circle':
            circle = new Path.Circle(initialPointCir, 60);
            circle.strokeColor = 'black';
            circle.fillColor = current.color;
            emitCir(initialPointCir, 60);
            break;
        case 'pen':
            isPenDrawing = false;
            initialPointPenCopy = Object.assign({},initialPointPen);
            console.log('mouse released from pen' + Object.keys(initialPointPenCopy) );
            console.log('initial pen data ' + Object.keys(initialPointPen));
            emitPen(initialPointPenCopy);
            break;
        case 'brush':
            isBrushDrawing = false;
            MouseUpDrawBrush(event);
            // var copy = initialPointBrush.clone();
            // copy.position = new Point(100, 100);
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



function mouseDownDrawBrush(initialPointBrush) {
    initialPointBrush.fillColor = current.color;
    initialPointBrush.add(event.point);
    console.log('brush path mouse pressed positions' + initialPointBrush.position);
    isBrushDrawing = true;
}

function mouseDragDrawBrush(event) {
    console.log('brush path drag positions' + initialPointBrush.position);

    var step = event.delta / 2;
    step.angle += 90;

    var top = event.middlePoint + step;
    var bottom = event.middlePoint - step;

    initialPointBrush.add(top);
    initialPointBrush.insert(0, bottom);
    initialPointBrush.smooth();
}


function MouseUpDrawBrush(event) {
    initialPointBrush.add(event.point);
    initialPointBrush.closed = true;
    initialPointBrush.smooth();
    console.log('brush path mouse up positions' + initialPointBrush);
    console.log(initialPointBrush._segments[0]._point._x);
    cpyarr = Object.assign({}, initialPointBrush);
    console.log(cpyarr);
    emitBrush(cpyarr);

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

function emitBrush(path) {
    io.emit('drawBrush', path);
}

function emitPen(path){
    console.log('emit pen '+ path);
    io.emit('drawPen',path);
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

io.on('drawBrush', function (path) {
    view.draw();

    var brushClone = new Path(path._segments);
    brushClone.fillColor = current.color;
    console.log(brushClone)
    view.draw();
    // brushClone.fillColor= 'red';
    // console.log('draw brush event recieved',brushClone);   
})

io.on('drawPen', function(path){
    console.log(path);
    // var myPenClone = path.clone();
    // console.log('mypen clone '+ myPenClone);
    view.draw();
})