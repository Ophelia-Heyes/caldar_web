
var resizeSlider;
var resizeSliderValue;

window.onload = function () {
  // Make the DIV element draggable:
var draggables = document.getElementsByClassName("draggable-div");
//dragElement(document.getElementByClass("draggable-div"));
for (let index = 0; index < draggables.length; index++) {
  dragElement(draggables[index]);
  
}
resizeSlider = document.getElementById("resize-slider");
resizeSliderValue = document.getElementById("resize-slider-value");
resizeSlider.addEventListener("change", updateResizeValue);
resizeSlider.addEventListener("input", updateResizeValue);
};


function updateResizeValue(e){
  resizeSliderValue.textContent = e.target.value+"px";
}


function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  //var testContainer = document.querySelector('#test');
  var draggableHeader = elmnt.querySelector('.draggable-div-header');
  if (draggableHeader) {
    // if present, the header is where you move the DIV from:
    draggableHeader.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV: 
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top  = Math.min(window.innerHeight*.99-elmnt.offsetHeight, Math.max(window.innerHeight*.01, (elmnt.offsetTop - pos2))) + "px";
    elmnt.style.left = Math.min(window.innerWidth*.99-elmnt.offsetWidth, Math.max(window.innerHeight*.01, (elmnt.offsetLeft - pos1))) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
