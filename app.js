var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


io.sockets.on('connection', function (socket) {
  
  // (2): The server recieves a ping event
  // from the browser on this socket
  socket.on('ping', function ( data ) {
  
    console.log('socket: server recieves ping (2)');

    // (3): Emit a pong event all listening browsers
    // with the data from the ping event
    io.sockets.emit( 'pong', data );   
    
    console.log('socket: server sends pong to all (3)');

  });

  socket.on( 'drawLine', function( data ) {
    socket.broadcast.emit( 'drawLine', data );
  });

  socket.on('drawRect', function(data){
    socket.broadcast.emit('drawRect',data);
  });

  socket.on('drawCir', function(data){
    socket.broadcast.emit('drawCir',data);
  });

  socket.on('drawBrush',function(path){
    socket.broadcast.emit('drawBrush',path);
  });

  socket.on('drawPen',function(path){
    socket.broadcast.emit('drawPen',path);
  });
});


module.exports = {
  app:app,
  http:http
}
