var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var _ = require('lodash-node');

var users = [];
var timer = null;

app.get('/', function (req, res){
  res.sendfile('index.html');
});

io.on('connection', function (socket) {
  socket.on('login', function (user) {
    // if this socket is already connected,
    // send a failed login message
    if (_.findIndex(users, { socket: socket.id }) !== -1) {
      socket.emit('login_error', '您已经连接到服务器.');
    }

    // if(user.name === '蒋丹'){
    //   user = {
    //     type: 2,
    //     name: '蒋丹',
    //     'number': '34222219870602801x',
    //     reservation: '1504771710326',
    //     gender: '女',
    //     productname:'23234sf',
    //     investmentAmount:'500万',
    //     wait: 1
    //   }
    // }
    console.log(user);
    if(!timer){
      timer = setInterval(refreshUser, 1000);
    }
    // if this name is already registered,
    // send a failed login message
    if (_.findIndex(users, { name: user.name }) !== -1) {
      socket.emit('login_error', '这个用户名已经登录.');
      return; 
    }
    user.wait = 1;// 等待时间
    users.push({ 
      name: user.name,
      socket: socket.id,
      user: user
    });

    // socket.emit('login_successful', _.pluck(users, 'name'));
    socket.emit('login_successful', _.pluck(users, 'user'));
    socket.broadcast.emit('online', user);
    console.log(user.name + ' 登入');
  });

  socket.on('sendMessage', function (name, message) {
    var currentUser = _.find(users, { socket: socket.id });
    if (!currentUser) { return; }
    console.log('sendMessage from ' + currentUser.name + 'to ','message',JSON.stringify(message));

    var contact = _.find(users, { name: name });
    if (!contact) { return; }

    console.log(currentUser);
    io.to(contact.socket)
      .emit('messageReceived', currentUser.name, message, currentUser);
  });

  socket.on('disconnect', function () {
    var index = _.findIndex(users, { socket: socket.id });
    if (index !== -1) {
      socket.broadcast.emit('offline', users[index].user);
      console.log(users[index].name + ' 已断开');

      users.splice(index, 1);
    }
  });
});

function refreshUser() {
  if(users.length === 0){
    clearInterval(timer);
    return;
  }
  users.forEach(function(user){
    if(!user.user.wait) {
      user.user.wait = 1;
    } else {
      user.user.wait++;
    }
  });
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});