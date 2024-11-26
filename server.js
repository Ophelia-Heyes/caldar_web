
// IO vars
const express = require('express');
const path = require('path');
var app = express();
const port = process.env.PORT || 10000;
const promises = require('fs').promises;

// data vars
var points = new Array(15 * 15 * 3);
var pointsStored = false;
var sprites;
var storedTransition;

var server = app.listen(port, function (err) {
    if (err) console.log(err);
    console.log(`App listening on port ${port}`);
});

// give user static public files
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html', 'htm']
}));

app.get('/images', async (req, res) => {
    console.log(req);
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

app.get('/safariImages', async (req, res) => {
    console.log(req);
    //res.sendFile(path.join(__dirname, 'public', 'index.html'));
    console.log("test");
    // try and serve images from directory
    try {
        const files = await promises.readdir("public/images/sprites/safari/");
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
    socket.on('points', onReceivePoints);
    socket.on('requestPoints', onRequestPoints);
    socket.on("sprites", onReceiveSprites);
    socket.on("requestSprites", onRequestSprites);
    socket.on("spriteMove", onReceiveSpriteMove);
    socket.on("effect", onReceiveEffect);
    socket.on("sceneTransition", onRecieveSceneTransition);
    socket.on("requestTransition", onRequestTransition);
    socket.on("error", onError);

    function onError(error){
        console.log(error);
    }

    function mouseMsg(data) {
        socket.broadcast.emit('mouse', data);
    }

    function cookieUsername(username) {
        console.log(username);
    }

    function onRequestTransition(){
    io.to(socket.id).emit('sceneTransition', storedTransition);
    }

    function onRecieveSceneTransition(sceneTransition) {
        storedTransition = sceneTransition;
        socket.broadcast.emit('sceneTransition', sceneTransition)
    }

    function onReceiveSprites(receivedSprites) {
        sprites = receivedSprites;
        socket.broadcast.emit('sprites', sprites);
    }

    function onReceiveEffect(effect) {
        console.log("server received effect");
        socket.broadcast.emit('effect', effect);
    }

    function onRequestSprites() {
        // reply to only the client that requested points
        console.log('sent reply to: ' + socket.id);
        io.to(socket.id).emit('sprites', sprites);
    }

    function onReceiveSpriteMove(spriteMove) {
        socket.broadcast.emit('spriteMove', spriteMove);
    }

    function onReceivePoints(receivedPoints) {
        if (receivedPoints[0] != null) {
            pointsStored = true;
            for (let index = 0; index < points.length; index++) {
                points[index] = receivedPoints[index];
            }
        }
        socket.broadcast.emit('points', points);
        // io.sockets.emit('points', points);
        console.log("emitting points");
    }

    function onRequestPoints() {
        // reply to only the client that requested points
        console.log('sent reply to: ' + socket.id);
        io.to(socket.id).emit('requestPoints', points);
    }
}



async function getDirs(){
const testFileDir = await promises.readdir("public/images/");
return testFileDir
}

function logDirs(dirs){
    let re = new RegExp("\\..*$")
    // get only directories
    dirs = dirs.filter(file => !re.test(file));
    console.log(dirs);
}

function getAndLogDirs() {
    getDirs().then(result => {logDirs(result)});
}

getAndLogDirs();