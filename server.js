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

var points = new Array(15*15*2);
var pointsStored = false;

var sprites;

var server = app.listen(port, function (err) {
    if (err) console.log(err);
    console.log(`App listening on port ${port}`);
}); 

// give user static public files
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html', 'htm']
}));

app.get('/images', async (req, res) => {
    //res.sendFile(path.join(__dirname, 'public', 'index.html'));
    console.log("test");
    // try and serve images from directory
    try {
        const files = await promises.readdir("public/images/sprites/player/");
        res.status(200).json(files);
    } catch (err) {
        res.status(500).json(err);
    }
});

console.log("socket running");
var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log('new connection: ' + socket.id);
    socket.on('mouse', mouseMsg);
    socket.on('username', cookieUsername);
    socket.on('points', onRecievePoints);
    socket.on('requestPoints', onRequestPoints);
    socket.on("sprites", onRecieveSprites);
    socket.on("requestSprites", onRequestSprites);
    socket.on("spriteMove", onReceiveSpriteMove);

    function mouseMsg(data) {
        socket.broadcast.emit('mouse', data);
    }

    function cookieUsername(username) {
        console.log(username);
    }

    function onRecieveSprites(recievedSprites){
        sprites = recievedSprites;
        socket.broadcast.emit('sprites', sprites);
    }

    function onRequestSprites(){
        // reply to only the client that requested points
        console.log('sent reply to: '+ socket.id);
        if (sprites.length!=0){
        io.to(socket.id).emit('requestSprites', sprites);
        }
    }

    function onReceiveSpriteMove(spriteMove){
        socket.broadcast.emit('spriteMove', spriteMove);
    }

    function onRecievePoints(recievedPoints) {
        if (recievedPoints[0]!= null) {
            pointsStored = true;
            for (let index = 0; index < points.length; index++) {
                points[index] = recievedPoints[index];
            }
        }
        socket.broadcast.emit('points', points);
        // io.sockets.emit('points', points);
        console.log("emitting points");
    }

    function onRequestPoints(){
        // reply to only the client that requested points
        console.log('sent reply to: '+ socket.id);
        io.to(socket.id).emit('requestPoints', points);
    }
}
