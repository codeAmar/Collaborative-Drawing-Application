var express = require('express');
var session = require('express-session');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var drawingPortal = require('./routes/drawingPortal');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var nsp = io.of('/drawing');

var allusers = [];
var allsocketobjects = [];
var privateDrawing = [];

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cookieParser());

app.use(session({
  secret: 'codeamar',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}));


app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/users', users);
app.use('/drawing', drawingPortal);


app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});



nsp.on('connection', function (socket) {

  console.log('someone connected to drawing nsp ', socket.id);

  
  socket.on('ping', function (data) {
    
    console.log('socket: server recieves ping (2)');

    io.sockets.emit('pong', data);

    console.log('socket: server sends pong to all (3)');

  });

  socket.on('drawLine', function (data) {
    socket.broadcast.emit('drawLine', data);
  });

  socket.on('drawRect', function (data) {
    socket.broadcast.emit('drawRect', data);
  });

  socket.on('drawCir', function (data) {
    socket.broadcast.emit('drawCir', data);
  });

  socket.on('drawTri', function (data) {
    socket.broadcast.emit('drawTri', data);
  });

  socket.on('drawBrushs', function (path) {
    socket.broadcast.emit('drawBrushs', path);
  });

  socket.on('drawPens', function (path) {
    socket.broadcast.emit('drawPens', path);
  });

});



io.on('connection', function (socket) {

  console.log('someone connected to / namespace: ', socket.id);

  socket.on('chat message', function (msg) {
    console.log('chat message');
    io.emit('chat message', socket.username, msg);
  });

  socket.on('username', function (user) {
    socket.username = user;
    // console.log('username');
    console.log('socket id :', socket.id);
    // console.log('socket rooms :', socket.rooms);
    allusers.push(socket.username);
    allsocketobjects.push(socket);
    console.log('allusers', allusers);
    // console.log('allsocketobjects', allsocketobjects);
    io.emit('allusers', allusers);
    socket.emit('username', "Hi " + user + "! You are connected!");
    socket.broadcast.emit('guest connected', user + " has entered the chat room");
  });

  socket.on('private_request', function (sender, receiver) {
    // console.log('private request sender ', sender);
    // console.log('private request reciever', receiver);
    // console.log('uid private request', uid);    
    var receiver_id1, reciever_name;
    for (var i = 0; i < allusers.length; i++) {
      if (allsocketobjects[i].username == receiver) {
        receiver_id1 = allsocketobjects[i].id;
        reciever_name = receiver;
      }
    }


    privateDrawing.push({
      user : receiver_id1,
      name : reciever_name,
      uid : 0
    });
    // socket.broadcast.emit('first Drawing member',privateDrawing);   
    socket.broadcast.to(receiver_id1).emit('private_request_received', this.username, " wants to draw with you. Click to start drawing together! ");
  });


  socket.on('joined room', function (username, receiver) {
    var receiver_id, initialUser;
    for (var i = 0; i < allusers.length; i++) {
      if (allsocketobjects[i].username == receiver) {
        receiver_id = allsocketobjects[i].id;
        initialUser = receiver;
      }
    }
    // privateDrawing.push({
    //   user : receiver_id,
    //   name : initialUser,
    //   uid : uid
    // });
    // socket.broadcast.emit('first Drawing member',privateDrawing);     
    socket.broadcast.to(receiver_id).emit('join drawing', username, receiver);
  });
  /////////////////////////////////
  // socket.on('drawingGroup', function () {

  // socket.join('drawingGroup', function () {
  //   console.log('drawingGroup joined');
  // });
  // });

  /////////////////////////////////////
  socket.on('joinedRoom', function (username,uid) {
    var username_id1, finalUser1;
    for (var i = 0; i < allusers.length; i++) {
      if (allsocketobjects[i].username == username) {
        username_id1 = allsocketobjects[i].id;
        finalUser1 = username;
      }
    }
    privateDrawing.push({
      user: username_id1,
      name: finalUser1,
      uid: uid
    });
    console.log('private drawing members :', privateDrawing);
    socket.broadcast.emit('second Drawing member', privateDrawing);
  });


  socket.on('joinedRoom2', function (username,uid) {
    var username_id2, finalUser2;
    for (var i = 0; i < allusers.length; i++) {
      if (allsocketobjects[i].username == username) {
        username_id2 = allsocketobjects[i].id;
        finalUser2 = username;
      }
    }
    privateDrawing.push({
      user: username_id2,
      name: finalUser2,
      uid: uid
    });
    console.log('private drawing members :', privateDrawing);
    socket.broadcast.emit('first Drawing member', privateDrawing);
  });

  socket.on('disconnect', function () {
    // console.log('ROOMS:',io.sockets.adapter.rooms);
    // console.log('allsocketObject :',allsocketobjects);
    console.log('disconnect');
    if (socket.username == undefined) {} else {
      var name = socket.username;
      socket.broadcast.emit('guest disconnected', name + " has left the chat room");
      var index = allusers.indexOf(name);
      if (index > -1) {
        allusers.splice(index, 1);
        allsocketobjects.splice(index, 1);
        privateDrawing.splice(index, 1);
      }
      io.emit('allusers', allusers);
    }
  });

});



module.exports = {
  app: app,
  http: http,
  privateDrawing: privateDrawing
}