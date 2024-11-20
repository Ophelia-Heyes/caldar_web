var socket;
socket = io.connect();

point = [];



function setup() {
  createCanvas(400, 400);
  background(255,0,0);
  modal = new Modal("Enter Username",1);
  console.log(document.cookie);
  checkCookie();

  //socket = io.connect(process.env.PORT || 3000);
  //socket.on('mouse', newDrawing);
}

function newText(){
  username = modal.modalTextBox.value();
  console.log(username);
  document.cookie = "username="+username;
  socket.emit('username', username);
  modal.isVisible = false;
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

function checkCookie(){
  let username = getCookie("username");
  if (username != ""){
    socket.emit('username', username);
    // use to clear cookie
    //document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
  else{
    console.log("open modal");
    modal.isVisible = true;
  }
}

function getCookie(cookieName) {
  let name = cookieName + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

class Modal {
  constructor(title, contents){
  this.modal = select('.modal-wrapper');
  this.modalTitle = select('#modal-title');
  this.modalTitle.elt.innerHTML = title;
  this.button = select('#modal-button');
  this.modalTextBox = select('#modal-textbox');
  this.modalTextBox.changed(newText);
  this.button.mousePressed(newText);
  this.isVisible = false;
  } 
  #visibleToggle = false;

  get isVisible(){
    return this.visibleToggle;
  }

  set isVisible(toggle){
    this.visibleToggle = toggle;
    this.modal.elt.style.display = (toggle) ? 'flex' : 'none';
  }
}