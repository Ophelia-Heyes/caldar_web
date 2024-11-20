const express = require('express');
const path = require('path');
var app = express();
const port = process.env.PORT || 10000;
const promises = require('fs').promises;

// const router = express.Router();

// app.get("/user", (req, res) => {
//     app.use(express.static('public'));
// });

// app.get("/dm_screen", (req, res) => {
//     app.use(express.static('public'));
// });


var server = app.listen(port, function(err){
    if (err) console.log(err);
    console.log(`App listening on port ${port}`);
});

// give user static public files
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html', 'htm']
}));

app.get('/images', async(req, res) => {
    //res.sendFile(path.join(__dirname, 'public', 'index.html'));
    console.log("test");
    // try and serve images from directory
    try {
        const files = await promises.readdir("public/images/sprites");
        res.status(200).json(files);
    } catch (err) {
        res.status(500).json(err);
    }
});

console.log("socket running");
var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);
function newConnection(socket){
    console.log('new connection: ' + socket.id);
    socket.on('mouse', mouseMsg);
    socket.on('username', cookieUsername);
function mouseMsg(data){
    socket.broadcast.emit('mouse', data);
    }
function cookieUsername(username){
    console.log(username);
}
}