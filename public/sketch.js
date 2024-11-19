var socket;
socket = io.connect();

function setup() {
  createCanvas(400, 400);
  background(50);
  //socket = io.connect(process.env.PORT || 3000);
  socket.on('mouse', newDrawing);
}

function mouseDragged(){
  console.log(mouseX + ',' + mouseY);
  ellipse(mouseX, mouseY, 36, 36);
  var data = {
    x:mouseX,
    y:mouseY
  }
  socket.emit('mouse', data);
}

function draw() {
  noStroke();
  fill(255);
}

function newDrawing(data) {
  noStroke();
  fill(255, 0, 100);
  ellipse(data.x, data.y, 36, 36);
}

