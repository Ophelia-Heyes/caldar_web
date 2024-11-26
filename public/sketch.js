
// TOOLTIPS
// keyboard controls:
// P to move the battle map around
// L to warp in a line
// T to move tiles
// M to measure distances
// K to kill or blackout tiles
// H to swap between square and hex grids
// R to reset map
// Q to open fissure (change background)
// A to ripple the map

// toggle for testing
voronoiShaderActive = true;
effectsShadingActive = true;
let backgroundToggle;
let filterToggle;

defaultCanvasSize = 400;

let displaceColors;

// average fps
averageFps = 0;
frameTimes = [];
timeCounter = 0;

totalBytesSent = 0;

let canvasContainer = document.getElementById("canvas-container");

let browser;


// Effect Controls

var socket;
socket = io.connect();

var userIsDM = window.location.pathname === "/dm_screen" || window.location.pathname === "/sketch";
var userControlled = [];

var logged = false;

let effectPoint = [0.85, 0.35],
  effectWidth = 0.75,
  effectStrength = 1.0,
  glitchEffect = 0,
  font;
const activeEffects = [];

initialSpriteRequestReplied = false;

class Sprite {
  constructor(name, pos, attachPoint, image) {
    this.name = name;
    this.pos = pos;
    this.attachPoint = attachPoint;
    this.image = image;
  }
}

// setup points
numPerRow = 15;
const numPoints = numPerRow * numPerRow,
  // flattened list of vec3 for shader
  rawPts = Array(numPoints * 2).fill(0),
  // list of vec2
  points = new Array(numPoints).fill(null);

sprites = [];
dragRadius = 40;
let activeSpritePoint = null;

// setup shaders
let glitchShader,
  voronoiShader,
  electroShader;

class Mode {
  constructor(name) {
    this.name = name;
    this.toggle = false;
  }
  toggleMode() {
    // console.log(this.name);
    this.toggle = !this.toggle;
    // console.log(this.toggle);
  }
}

// setup modes
modes = {
  measureMode: new Mode("Measure"),
  gridIsHexMode: new Mode("Hex"),
  dragMapMode: new Mode("Drag Map"),
  lineMode: new Mode("Line"),
  moveMode: new Mode("Move"),
  randomMode: new Mode("Random"),
  resetMode: new Mode("Reset"),
  killMode: new Mode("Kill"),
  relaxMode: new Mode("Relax"),
  attackMode: new Mode("Attack")
}
measureMode = false;
measureStartPt = null;
measureEndPt = null;
measureActive = false;
gridIsHex = false;
dragMapDelta = [0, 0];
lineModeActive = false;
lineEffect = null;
moveModeActive = false;
moveEffect = null;
movePt = null;
killModeActive = false;
dragKill = 0;
activeRelax = null;

// scene transition
sceneTransStart = 0.;
sceneTransition = false;
sceneTransDirection = false;
sceneTransLerpTime = 0.;

// turn off right click context menu within canvas
document.oncontextmenu = function () {
  if (mouseX < width && mouseY < height)
    return false;
}

function preload() {
  // loading font is necessary in webgl mode
  font = loadFont('fonts/Roboto-Bold.ttf');
  // load shaders
  glitchShader = loadShader("filter.vert", "glitch.frag");
  voronoiShader = loadShader('voronoi.vert', 'voronoi.frag');
  electroShader = loadShader('filter.vert', 'electro.frag');
  // load in images
  backgroundImage = loadImage("/images/backgrounds/desert.jpg");
  foregroundImage = loadImage("/images/backgrounds/space_seamless.jpg");
  // for (let i = 0; i < spriteNames.length; i++) {
  //   spriteImages.push(loadImage('sprites/' + spriteNames[i] + '_token.png'));
  // }
}

async function getImages() {
  let files;

  if (browser=="Safari"){
    try {
      const response = fetch("/safariImages/");
      files = await response;
      return files.json();
    } catch (err) {
    }
  }

  try {
    const response = fetch("/images/");
    files = await response;
    return files.json();
  } catch (err) {
    // console.error(err)
  }
}

let storeImagePaths;

function createImagePaths(imageNames) {
  imageNames = imageNames.filter(file => file.endsWith('.png')||file.endsWith('.webm')||file.endsWith('.mov'));
  let pngRegex = new RegExp("\\.png$");
  let directory = (browser=="Safari") ? "images/sprites/safari/" : "images/sprites/player/";
  console.log("directory: " + directory);
  // create and scatter sprites
  for (let i = 0; i < imageNames.length; i++) {
    let imagePath = directory + imageNames[i];
    x = random(width) - (width / 2);
    y = random(height) - (height / 2);
    maxDist = 100000;
    id = 0;
    for (let i = 0; i < numPoints; i++) {
      testD = dist((x + width / 2) / width, (y + height / 2) / height, points[i].x, points[i].y);
      if (testD < maxDist) {
        maxDist = testD;
        id = i;
      }
    }
    let imageObject;
    if (pngRegex.test(imagePath)){
      imageObject = loadImage(imagePath);
    }
    else{
      console.log("loaded video!!");
      imageObject = createVideo(imagePath);
      imageObject.muted=false;
      imageObject.play();
      imageObject.loop();
      imageObject.hide();
    }
    sprites.push(new Sprite(imagePath, createVector(x, y), id, imageObject));
  }
  socket.emit("requestSprites");
}

function createSprites() {
  getImages().then(result => { createImagePaths(result)
  });
}

function onResizeCanvas(){
  // don't let screen get larger than 80% window size
  let resizeValue = Math.min(Math.min(window.innerWidth, window.innerHeight)*.8, canvasResizeSlider.value);
  resizeCanvas(resizeValue, resizeValue);
}

function onResizeSlider(){
  // display canvas size
  // canvasSliderValue.html("Canvas Size: "+canvasResizeSlider.value()+"px");
}

// change for more general setup function?
function setupShaderToggles(){
  backgroundToggle = document.getElementById("background-effects-checkbox");
  filterToggle = document.getElementById("screenspace-effects-checkbox");
  backgroundToggle.addEventListener("change", onUpdateShaderToggles);
  filterToggle.addEventListener("change", onUpdateShaderToggles);
}

function onUpdateShaderToggles(){
  console.log("called updateShaderToggles");
  voronoiShaderActive=backgroundToggle.checked;
  effectsShadingActive=filterToggle.checked;
}

function setup() {
  if (!userIsDM){
    submitChoices();
  }
  browser = navigator.saysWho[0];

  canvasContainer = document.getElementById("canvas-container");
  let canvas = createCanvas(defaultCanvasSize, defaultCanvasSize, WEBGL);
  canvas.parent("canvas-container");
  canvasResizeSlider = document.getElementById("resize-slider");
  resizeSlider.addEventListener("change", onResizeCanvas);
  
  setupShaderToggles();

  // canvasResizeSlider = createSlider(100,1000,defaultCanvasSize,100);
  // canvasResizeSlider.parent("canvas-container");
  // canvasResizeSlider.class("resize-slider");
  // canvasSliderValue = createDiv();
  // canvasSliderValue.parent("canvas-container");
  // canvasSliderValue.class("resize-slider-text");
  // onResizeSlider();
  // canvasResizeSlider.input(onResizeSlider);
  
  textFont(font);
  textSize(12);
  handleCreateUI();

  displaceColors = createFilterShader(`precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord;

vec2 zoom(vec2 coord, float amount) {
  vec2 relativeToCenter = coord - 0.5;
  relativeToCenter /= amount; // Zoom in
  return relativeToCenter + 0.5; // Put back into absolute coordinates
}

void main() {
  // Get each color channel using coordinates with different amounts
  // of zooms to displace the colors slightly
  gl_FragColor = vec4(
    texture2D(tex0, vTexCoord).r,
    texture2D(tex0, zoom(vTexCoord, 1.05)).g,
    texture2D(tex0, zoom(vTexCoord, 1.1)).b,
    texture2D(tex0, vTexCoord).a
  );
}`);

  // bit we care about
  checkPoints();
  socket.on('points', onReceivePointsFromServer);
  socket.on('sprites', onReceiveSpritePositionUpdates);
  socket.on('effect', onReceiveEffect);
  socket.on('sceneTransition', onRecieveSceneTransition);
  socket.emit('requestTransition');

  createSprites();

  // this causes the shader texture to be rendered under everything else
  gl = this._renderer.GL;
  gl.disable(gl.DEPTH_TEST);
  noStroke();
}

function draw() {
  // handle logic
  updatePoints();

  // the rest is display

  // update shader variables
  //enemyPos = sprites[0].pos;
  // temp fix
  enemyPos = createVector(0.5, 0.5);
  voronoiShader.setUniform("effectCenter", [.5, .5]);
  //voronoiShader.setUniform("effectCenter", [(enemyPos.x / width) + .5,
  //(enemyPos.y / height) + .5]);
  voronoiShader.setUniform("background", backgroundImage);
  voronoiShader.setUniform("foreground", foregroundImage);
  voronoiShader.setUniform("points", rawPts);
  voronoiShader.setUniform("millis", millis());
  electroShader.setUniform("millis", millis());
  if (sceneTransition) {
    handleSceneTransition();
  }

  // clear image
  background(0);

  // turned off slow shaders for testing

  //draw background
  if (voronoiShaderActive) {
    shader(voronoiShader);
    rect(-width / 2, -height / 2, width, height);
    resetShader();
  }
  else {
    fill(80);
    rect(-width / 2, -height / 2, width, height);
  }
  fill(255);


  // draw points
  for (let i = 0; i < numPoints; i++) {
    circle((rawPts[i * 2] * width) - width / 2,
      (rawPts[i * 2 + 1] * width) - width / 2, Math.max(1, width*.006));
  }

  // draw sprites
  fill(255, 255, 255, 255);
  imageMode(CENTER);
  //update sprite position
  updateSpritePosition();
  for (let p of sprites) {
    image(p.image, p.pos.x, p.pos.y, width / 10, width / 10);
  }

  if (effectsShadingActive) {
    // filters
    electroShader.setUniform("effectPos", [(enemyPos.x / width),
    (enemyPos.y / height), 0.75]);
    filterShader(electroShader);
    if (activeEffects.length > 0) {
      glitchShader.setUniform("noise", getNoiseValue());
      filterShader(glitchShader);
    }
  }

 // filter(displaceColors);

  // display FPS

  // averageFps = 0;
  // frameTimes = [];
  // timeCounter = 0;

  displayFPS();


  updateModes();

}

function keyPressed() {
  // any user modes
  switch (key) {
    case "m":
      measureMode = !measureMode;
      // console.log("m");
      measureStartPt = (measureMode) ? measureStartPt : null;
      break;
    default:
  }
  // DM modes
  if (userIsDM) {
    // console.log("on dm screen, allowing modes");
    switch (key) {
      // test case
      case "b":
        broadcastPoints();
      break;
      case "q":
        // handle opening rift
        sceneTransDirection = !sceneTransDirection;
        if (sceneTransition == false) {
          sceneTransition = true;
          sceneTransStart = millis();
        }
        broadcastSceneTransition();
        break;
      case "k":
        modes.killMode.toggle = !modes.killMode.toggle;
        break;
      case "p":
        modes.dragMapMode.toggle = !modes.dragMapMode.toggle;
        break;
      case "t":
        // move point
        moveModeActive = !moveModeActive;
        break;
      case "r":
        pushToActiveEffects(new Effect(points, resetEffect, [0, 0], 1, 2, easeInSine));
        break;
      case "h":
        // shift between square grid and hex grid
        gridIsHex = !gridIsHex;
        let sign = (gridIsHex) ? 1 : -1;
        // // console.log(sign);
        pushToActiveEffects(new Effect(points, squareToHexEffect, [0, 0], sign, 2, easeInSine));
        //                          (initPts, effect, center, magnitude, endTime, easeFunction = null)
        break;
      case "l":
        lineModeActive = !lineModeActive;
        break;
      case "f":
        // randomize or "fracture" grid
        pushToActiveEffects(new Effect(points, noiseEffect, [0, 0], .1, 2, easeInSine));
        break;
      case "a":
        // "attack mode"
        // // console.log([sprites[0].pos.x/width+1, sprites[0].pos.y/height+1]);
        pushToActiveEffects(new Effect(points, rippleEffect, [sprites[0].pos.x / width + .5, sprites[0].pos.y / height + .5], 0.2, 10, 1, easeInSine));
        break;
      case "c":
        if (activeRelax != null) {
          if (!activeRelax.isActive) {
            activeRelax = null;
          }
        }
        if (activeRelax == null) {
          activeRelax = new Effect(points, relaxEffect, [0, 0], 1, .25);
          pushToActiveEffects(activeRelax);
        }
        break;
      default:


    }
  }
}

function handleSceneTransition() {
  // allows for hotswapping direction while lerping
  sceneTransLerpTime += (sceneTransDirection) ? deltaTime / 5000 : -deltaTime / 5000;
  let lerpCheck = (sceneTransDirection) ? sceneTransLerpTime >= 1 : sceneTransLerpTime <= 0;
  if (lerpCheck) {
    sceneTransition = false;
    sceneTransLerpTime = sceneTransDirection;
  }
  let transMag = sceneTransLerpTime;
  voronoiShader.setUniform("transition", transMag);
  electroShader.setUniform("electroIntensity", transMag)
}

function updateModes() {
  if (measureMode) {
    updateMeasureMode();
  }
}

function updateMeasureMode() {
  if (measureStartPt != null) {
    // // console.log('yes');
    if (measureActive) {
      measureEndPt = mouseNearPoint();
    }
    shortestPath = generateDelaunayShortestPath(measureStartPt, measureEndPt);
    path = shortestPath.path;
    fill(0, 255, 255);
    textSize(12);
    for (let i = 0; i < path.length; i++) {
      p1 = parseInt(path[i]);
      p2 = parseInt(path[i + 1]);
      noStroke();
      circle((rawPts[p1 * 2] - 0.5) * width, (rawPts[p1 * 2 + 1] - 0.5) * height, 10);
      text(i * 5 + " ft", (rawPts[p1 * 2] - 0.5) * width + 15, (rawPts[p1 * 2 + 1] - 0.5) * height + 15);
      stroke(0, 255, 255);
      strokeWeight(2);
      if (path.length - i != 1) {
        line((rawPts[p1 * 2] - 0.5) * width,
          (rawPts[p1 * 2 + 1] - 0.5) * height,
          (rawPts[p2 * 2] - 0.5) * width,
          (rawPts[p2 * 2 + 1] - 0.5) * height
        );
      }
    }
    circle((rawPts[measureEndPt * 2] - 0.5) * width, (rawPts[measureEndPt * 2 + 1] - 0.5) * height, 15);
    // measurement text
    noStroke();
    textSize(16);
    text((shortestPath.path.length - 1) * 5 + " ft", mouseX + 20 - width / 2, mouseY + 25 - height / 2);
  }
}

function mouseNearPoint() {
  let maxDist = 100000;
  let id = 0;
  for (let i = 0; i < numPoints; i++) {
    let testD = dist(mouseX / width, mouseY / height, rawPts[i * 2], rawPts[i * 2 + 1]);
    if (testD < maxDist) {
      maxDist = testD;
      id = i;
    }
  }
  return id;
}

function updatePoints() {
  if (!points.some(el => el === null)) {
    effectsManager();
    // set raw points to send to the shader
    for (let i = 0; i < points.length; i++) {
      p = points[i];
      rawPts[i * 2] = setInsignificantBit(p.x, p.z);
      rawPts[(i * 2) + 1] = p.y;
      // third term is for voronoi effects
      //rawPts[(i * 3) + 2] = p.z;
    }
  }
}

function effectsManager() {
  // if any effects to run
  if (activeEffects.length > 0) {
    warpedPts = points;
    // loop backwards, removing effects that have finished
    for (let i = activeEffects.length - 1; i >= 0; i--) {
      // // console.log("test!");
      if (activeEffects[i].isActive) {
        // do each effect
        warpedPts = activeEffects[i].update(warpedPts);
      }
      else {
        activeEffects.splice(i, 1);
      }
    }
    // if (activeEffects.length != 0) {
    //   broadcastPoints();
    // }
    // reassign values of const array
    for (let i; i < points.length; i++) {
      points[i] = warpedPts[i];
    }
    // if number of effects has gone to zero on this step,
    //broadcast results to ensure every user has the same state
    if (activeEffects.length == 0) {
      // console.log(activeEffects.length);
      broadcastPoints();
    }
  }
}

function pushToActiveEffects(effect) {
  activeEffects.push(effect);
  let easeFunction = effect.easeFunction ? effect.easeFunction.name : null;
  sendEffect = {
    effect: effect.effect.name,
    center: effect.center,
    magnitude: effect.magnitude,
    endTime: effect.endTime / 1000,
    falloff: effect.falloff,
    easeFunction: easeFunction,
    killOnComplete: effect.killOnComplete
  };
  socket.emit('effect', sendEffect);
}

function onReceiveEffect(effect) {
  let reconstructedEffect = new Effect(points, window[effect.effect], effect.center,
    effect.magnitude, effect.endTime, effect.falloff,
    window[effect.easeFunction], effect.killOnComplete);
  activeEffects.push(reconstructedEffect);
}

class Effect {
  constructor(initPts, effect, center, magnitude, endTime, falloff = 0, easeFunction = null, killOnComplete = true) {
    this.initPts = cloneVectorArray(initPts);
    this.effect = effect;
    this.center = center;
    this.magnitude = magnitude;
    this.endTime = endTime * 1000;
    this.easeFunction = easeFunction;
    this.startTime = millis();
    this.isActive = true;
    this.lastTime = 0;
    this.falloff = falloff;
    this.killOnComplete = killOnComplete;
    // // console.log("started!");
  }
  update(curPts) {
    curPts = curPts;
    // percent finished constrained to a value 0-1
    let lerpTime = (millis() - this.startTime) / this.endTime;

    //// console.log(lerpTime);
    if (lerpTime >= 1) {
      // // console.log("finished!");
      lerpTime = 1;
      if (this.killOnComplete) {
        this.isActive = false;
      }
    }
    if (this.easeFunction != null) {
      lerpTime = this.easeFunction(lerpTime);
    }
    lerpTime = constrain(lerpTime, 0, 1);
    curPts = this.effect(this.initPts, curPts, this.magnitude, this.lastTime, lerpTime, this.falloff, this.center);
    this.lastTime = lerpTime;
    return curPts;
  }
}

function attractPointsEffect(x1, y1) {
  x2 = effectPoint[0];
  y2 = effectPoint[1];
  d = dist(x1, y1, x2, y2);
  d = d / effectWidth;
  d = constrain(d, 0, 1);
  d = easeInSine(1 - d);
  x1 = lerp(x1, x2, d * effectStrength);
  y1 = lerp(y1, y2, d * effectStrength);
  return [x1, y1];
}

function rotatePointsEffect(x1, y1) {

  x2 = effectPoint[0];
  y2 = effectPoint[1];
  x1 -= x2;
  y1 -= y2;
  d = dist(0, 0, x1, y1);
  d = d / effectWidth;
  d = constrain(d, 0, 1);
  d = easeInSine(1 - d);
  d *= sin(millis() / 1000);
  d *= effectStrength;
  d *= 0;
  cd = cos(d);
  sd = sin(d);
  x1 = cd * x1 - sd * y1;
  y1 = sd * x1 + cd * y1;
  x1 += x2;
  y1 += y2;
  return [x1, y1];
}

function movePointsEffect(initPts, curPts, magnitude, lastTime, lerpTime, falloff, center = null) {
  for (let i = 0; i < numPoints; i++) {
    let p = createVector(initPts[i].x, initPts[i].y);
    d = p5.Vector.dist(p, center[0]);
    d = d / falloff;
    d = constrain(d, 0, 1);
    d = easeInSine(1 - d);
    p.lerp(center[1], d * magnitude * lerpTime);
    curPts[i].x = p.x;
    curPts[i].y = p.y;
  }
  return curPts;
}

function lineAttractEffect(initPts, curPts, magnitude, lastTime, lerpTime, falloff, center = null) {
  // create new vectors so as not to affect input
  let l1 = createVector(center[0].x, center[0].y);
  let l2 = createVector(center[1].x, center[1].y);

  for (let i = 0; i < numPoints; i++) {
    let p = createVector(initPts[i].x, initPts[i].y);

    linePt = pointOnLineSegment(p, l1, l2);
    // distance
    let d = p5.Vector.dist(p, linePt);
    d = d / falloff;
    // map it to range 0-1 for given distance
    d = constrain(d, 0, 1);

    d = easeInSine(1 - d);
    // now lerp
    p.lerp(linePt, d * magnitude * lerpTime);
    // get relative position
    curPts[i].x = p.x;
    curPts[i].y = p.y;
  }
  return curPts;
}

function squareToHexEffect(initPts, curPts, magnitude, lastTime, lerpTime, falloff, center = null) {
  xOffset = 1 / ((numPerRow - 1) * 2) * magnitude;
  for (let i = 0; i < numPoints; i++) {
    x1 = initPts[i].x + + (Math.floor(i / numPerRow) % 2) * xOffset * lastTime;
    x2 = initPts[i].x + (Math.floor(i / numPerRow) % 2) * xOffset * lerpTime;
    curPts[i].x += x2 - x1;
  }
  return curPts;
}

function rippleEffect(initPts, curPts, magnitude, lastTime, lerpTime, falloff, center) {

  let c = createVector(center[0], center[1]);
  // creates a bell curve intensity
  magnitude *= 1 - easeInSine(abs(lerpTime - .5) * 2);
  for (let i = 0; i < numPoints; i++) {
    let p = createVector(initPts[i].x, initPts[i].y);
    // distance
    let d = p.dist(c);
    d = d / falloff;
    // map it to range 0-1 for given distance
    d = constrain(d, 0, 1);

    let wave = sin(d * 20 + lerpTime * 20);
    d = easeInSine(1 - d);
    // now lerp
    p.lerp(createVector(center[0], center[1]), wave * d * magnitude);
    // get relative position
    curPts[i].x = p.x;
    curPts[i].y = p.y;
  }
  return curPts;
}

function resetEffect(initPts, curPts, magnitude, lastTime, lerpTime, center) {
  for (let i = 0; i < numPoints; i++) {
    let p = createVector(initPts[i].x, initPts[i].y);
    let x = ((i % numPerRow) / (numPerRow - 1));
    let y = (Math.floor(i / numPerRow) / (numPerRow - 1));
    p.lerp(createVector(x, y), easeInSine(lerpTime));
    curPts[i].x = p.x;
    curPts[i].y = p.y
  }
  return curPts;
}

function noiseEffect(initPts, curPts, magnitude, lastTime, lerpTime, center) {
  let multiplier = 100;
  for (let i = 0; i < numPoints; i++) {
    let p = createVector(initPts[i].x, initPts[i].y);
    let n = createVector((noise(p.y * multiplier) - .5) * 2,
      (noise(p.x * multiplier) - .5) * 2);
    n.add(p);
    p.lerp(n, easeInSine(lerpTime) * magnitude);
    curPts[i].x = p.x;
    curPts[i].y = p.y
  }
}

// ophie's dumbass blur function
function relaxEffect(initPts, curPts, magnitude, lastTime, lerpTime, center) {
  let searchRadius = .05;
  for (let i = 0; i < numPoints; i++) {
    // loop again, find closest pts; 
    let closestPoints = [];
    let p = createVector(initPts[i].x, initPts[i].y);
    for (let j = 0; j < numPoints; j++) {
      let jPt = points[j].copy();
      // relative offset
      jPt.sub(p);
      //unsure whether to remove current point //i!=j &&
      if (i != j && jPt.mag() < searchRadius) {
        closestPoints.push(p5.Vector.mult(jPt, 1));
      }
      // now find distance from edges
      //distance from zero, essentially
      // "searchRadius-clamp(p, 0, searchRadius)"
      distFromEdge = createVector(-searchRadius).add(p5.Vector.limit(p, searchRadius));
      //distance from one, essentially
      // "searchRadius-clamp(1-p, 0, searchRadius)"
      distFromEdge.sub(createVector(searchRadius).sub(p5.Vector.limit(createVector(1).sub(p), searchRadius)));
      closestPoints.push(distFromEdge * .5);
    }
    // sum pts;
    let averagePt = closestPoints.reduce((u, v) => p5.Vector.add(u, v), createVector(0, 0));
    // divide by array length
    averagePt.mult(1 / closestPoints.length);
    // add original point position
    averagePt = p5.Vector.sub(p, averagePt);
    // lerp to relaxed point
    p.lerp(averagePt, lerpTime * 100);
    curPts[i].x = p.x;
    curPts[i].y = p.y
  }
}

function cloneVectorArray(inputArray) {
  cloneArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    cloneArray.push(inputArray[i].copy())
  }
  return cloneArray
}

function getNoiseValue() {
  let v = noise(millis() / 100);
  const cutOff = 0.4;

  if (v < cutOff) {
    return 0;
  }

  v = pow((v - cutOff) * 1 / (1 - cutOff), 2);

  return v;
}

function mousePressed() {
  if (modes.dragMapMode.toggle) {
    dragMapDelta[0] = mouseX;
    dragMapDelta[1] = mouseY;
  }
  if (modes.killMode.toggle) {
    handleKillMode();
  }
  if (lineModeActive) {
    handleStartLineMode();
  }
  if (moveModeActive) {
    handleStartMoveMode();
  }
  handleSpriteClick();

  if (measureMode) {
    if (mouseButton == 'left') {
      measureActive = !measureActive;
      if (measureActive) {
        measureStartPt = mouseNearPoint();
      }
      // console.log(measureActive);
    }
    if (mouseButton == 'right') {
      measureStartPt = null;
      measureActive = false;
    }
  }
}

function mouseDragged() {
  if (modes.killMode.toggle) {
    handleDragKillMode();
  }
  if (lineModeActive) {
    handleDragLineMode();
  }
  if (moveModeActive) {
    handleDragMoveMode();
  }
  if (modes.dragMapMode.toggle) {
    for (let i = 0; i < points.length; i++) {
      points[i].x = fract(points[i].x + (mouseX - dragMapDelta[0]) / width);
      points[i].y = fract(points[i].y + (mouseY - dragMapDelta[1]) / height);
    }
    dragMapDelta[0] = mouseX;
    dragMapDelta[1] = mouseY;
  }
  //voronoiShader.setUniform("clicked", 1.);
  if (activeSpritePoint != null) {
    sprites[activeSpritePoint].pos.set(mouseX - width / 2, mouseY - height / 2);
  }
}


function mouseReleased() {
  if (activeSpritePoint != null) {
    snapSprite();
  }
  activeSpritePoint = null;
  //voronoiShader.setUniform("clicked", 0.);
  if (lineModeActive) {
    handleReleaseLineMode();
  }
  if (moveModeActive) {
    handleReleaseMoveMode();
  }
}

function updateSpritePosition() {
  let anyUpdated = false;
  for (let i = 0; i < sprites.length; i++) {
    if (i != activeSpritePoint) {
      // don't update active sprite
      // get copy of point
      let pt = points[sprites[i].attachPoint].copy();
      pt = pt.sub(.5, .5);
      pt = pt.mult(width, height);
      // // let dist = p5.Vector.sub(sprites[i].pos, pt).magSq();
      if (!pt.equals(sprites[i].pos)) {
        anyUpdated = true;
        sprites[i].pos.set(pt.x, pt.y);
      }
    }
  }
  if (anyUpdated) {
    // console.log("updated!!!");
    sendSpritePositionUpdates();
  }
}


// class Sprite {
//   constructor(name, pos, attachPoint, image) {
//     this.name = name;
//     this.pos = pos;
//     this.attachPoint = attachPoint;
//     this.image = image;
//   }
// }

function sendSpritePositionUpdates() {
  // create new object based on sprite object that is more efficient for sharing
  if (initialSpriteRequestReplied) {
    spriteUpdates = sprites.map(sprite => ({
      name: sprite.name,
      pos: [sprite.pos.x, sprite.pos.y],
      attachPoint: sprite.attachPoint
    }));
    socket.emit('sprites', spriteUpdates);
  }
}

function onReceiveSpritePositionUpdates(spriteUpdates) {
  initialSpriteRequestReplied = true;
  // console.log("shouldn't receive any updates on this side");
  if (spriteUpdates !== null) {
    // console.log("sprite updates:");
    // console.log(spriteUpdates);
    for (let index = 0; index < spriteUpdates.length; index++) {
      let sprite = sprites[index];
      let spriteUpdate = spriteUpdates[index];
      sprite.pos.x = spriteUpdate.pos[0];
      sprite.pos.y = spriteUpdate.pos[1];
      sprite.attachPoint = spriteUpdate.attachPoint;
    }
  }
  else {
    // console.log("recieved null sprites, sending local sprites");
    sendSpritePositionUpdates();
  }
}

function snapSprite() {
  maxDist = 100000;
  id = 0;
  for (let i = 0; i < numPoints; i++) {
    testD = dist(mouseX / width, mouseY / height, points[i].x, points[i].y);
    if (testD < maxDist) {
      maxDist = testD;
      id = i;
    }
  }
  sprites[activeSpritePoint].attachPoint = id;


}

function handleSpriteClick() {
  if (userIsDM) {
    for (let i = sprites.length - 1; i >= 0; i--) {
      if (mouseInCircle(sprites[i].pos, dragRadius)) {
        activeSpritePoint = i;
      }
    }
  }
  // change for list of userControlled sprites
  else {
    for (let i = userControlled.length - 1; i >= 0; i--) {
      let sprite = sprites[userControlled[i]];
      if (mouseInCircle(sprite.pos, dragRadius)) {
        activeSpritePoint = userControlled[i];
      }
    }
  }
}

function handleKillMode() {
  let pt = mouseNearPoint();
  dragKill = 1 - points[pt].z;
  points[pt].z = dragKill;
}

function handleDragKillMode() {
  let pt = mouseNearPoint();
  points[pt].z = dragKill;
}

function handleStartMoveMode() {
  if (mouseButton == 'left') {
    movePt = mouseNearPoint();
    moveEffect = new Effect(cloneVectorArray(points), movePointsEffect, [points[movePt].copy(),
    createVector(mouseX / width, mouseY / width)], 1, .5, .25, easeInSine, false);
    //pushToActiveEffects(moveEffect);
    activeEffects.push(moveEffect);
  }
  if (mouseButton == 'right') {
    if (moveEffect != null) {
      moveEffect.magnitude = 0;
      // max out lerpTime
      moveEffect.lastTime = 10000000;
      moveEffect.killOnComplete = true;
      moveEffect = null;
    }
  }
}

function handleDragMoveMode() {
  if (mouseButton == 'left') {
    moveEffect.center[1].x = mouseX / width;
    moveEffect.center[1].y = mouseY / height;
    broadcastPoints();
  }
}

function handleReleaseMoveMode() {
  if (moveEffect != null) {
    moveEffect.isActive = false;
    moveEffect = null;
  }
}

function handleStartLineMode() {
  if (mouseButton == 'left') {
    // console.log("started line!");
    lineEffect = new Effect(cloneVectorArray(points), lineAttractEffect,
      [createVector(mouseX / width, mouseY / height), createVector(mouseX / width, mouseY / height)],
      1., .5, .25, easeInSine, false);
    activeEffects.push(lineEffect);  
    //pushToActiveEffects(lineEffect);
    // console.log(activeEffects);
  }
  if (mouseButton == 'right') {
    if (lineEffect != null) {
      lineEffect.magnitude = 0;
      // max out lerpTime
      lineEffect.lastTime = 10000000;
      lineEffect.killOnComplete = true;
      lineEffect = null;
    }
  }
}

function handleDragLineMode() {
  if (mouseButton == 'left') {
    lineEffect.center[1].x = mouseX / width;
    lineEffect.center[1].y = mouseY / height;
    broadcastPoints();
  }
}

function handleReleaseLineMode() {
  if (lineEffect != null) {
    lineEffect.isActive = false;
    lineEffect = null;
  }
}

function mouseInCircle(pos, radius) {
  return dist(mouseX - width / 2, mouseY - height / 2, pos.x, pos.y) < radius;
}

// UI

function handleCreateUI() {
  fill(255, 0, 0);
  let h = 20;
  let border = 5;
  // rect(border-width/2, (height/2)-h-border, width-border*2, h, 5);
  // fileInput = createFileInput(handleReadFile);
  // fileInput.position(30, height+30);
  let modesArray = Object.entries(modes);
  let buttonX = (width / modesArray.length);
  let buttonY = height + 30;
  buttonDiv = createDiv();
  buttonDiv.size(width, 50);
  buttonDiv.class("flex-container");
  buttonDiv.style("display", "flex");
  buttonDiv.style("justify-content", "space-evenly");
  //// console.log(modesArray);
  if (userIsDM){
  for (let [index, value] of Object.entries(modes).entries()) {
    let mode = value[1];
    let button = createButton(mode.name);
    button.class("flex-item");
    button.style("flex-grow", "1");
    button.mousePressed(() => mode.toggleMode());
    buttonDiv.child(button);
    }
  }

}

// IO

function onReaderLoad(event){
  //console.log(event.target.result);
  var obj = JSON.parse(event.target.result);
  //alert_data(obj.name, obj.family);
}

function handleReadFile() {
  data = document.getElementById("file-input");
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  data=reader.readAsText(data.files[0]);
  console.log(data);
  // // console.log(data);
  for (let i = 0; i < points.length; i++) {
    points[i].x = data.points[i].x;
    points[i].y = data.points[i].y;
  }
  for (let i = 0; i < sprites.length; i++) {
    sprites[i].pos.x = data.sprites[i].pos.x;
    sprites[i].pos.y = data.sprites[i].pos.y;
    sprites[i].attachPoint = data.sprites[i].attachPoint;
  }
}
function handleSaveFile() {
  let saveSprites = [];
  for (let i = 0; i < sprites.length; i++) {
    saveSprites.push({ pos: sprites[i].pos, attachPoint: sprites[i].attachPoint })
  }
  let data = {
    points: points,
    sprites: saveSprites
  };
  saveJSON(data, 'saveData.json');
}


function broadcastPoints() {
  let compressedPts = compressPoints();
  socket.emit('points', compressedPts);
  totalBytesSent += getByteSize(compressedPts);
  // console.log("total kBs sent: " + totalBytesSent / 1000);
}

function getByteSize(obj) {
  const stringifiedObj = JSON.stringify(obj);
  const blob = new Blob([stringifiedObj]);
  return blob.size;
}

function compressPoints() {
  let compressedPts = [];
  for (let index = 0; index < points.length; index++) {
    let pt = points[index];
    compressedPts.push(pt.x);
    compressedPts.push(pt.y);
    compressedPts.push(pt.z);
  }
  //// console.log(compressedPts.length);
  return compressedPts;
}

function uncompressPoints(compressedPts) {
  for (let index = 0; index < points.length; index++) {
    let x = compressedPts[index * 3];
    let y = compressedPts[index * 3 + 1];
    let z = compressedPts[index * 3 + 2];
    points[index] = createVector(x, y, z);
  }
}

function onReceivePointsFromServer(receivedPoints) {
  // console.log(receivedPoints);
  if (!receivedPoints.some(el => el === null)) {
    //// console.log('points from server!!');
    uncompressPoints(receivedPoints);
    // for (let index = 0; index < points.length; index++) {
    //   // receiving raw points, so now we have to convert back
    //   //let p = receivedPoints[index];
    //   // points[index] = createVector(p.x, p.y);

    // }
  }
  else {
    // console.log("received null, generating points");
    generatePointGrid();
    broadcastPoints();
  }
}

function checkPoints() {
  generatePointGrid();
  // try get points from server:
  // console.log("requesting points");
  socket.emit("requestPoints");
  socket.on("requestPoints", onReceivePointsFromServer);
}

function generatePointGrid() {
  // initialize point grid
  let numPoints = numPerRow * numPerRow;
  for (let i = 0; i < numPoints; i++) {
    x = ((i % numPerRow) / (numPerRow - 1));
    y = (Math.floor(i / numPerRow) / (numPerRow - 1));
    points[i] = (createVector(x, y, 1));
  }
}

// html

function displayImages(imageNames) {
  imageNames.filter(file => file.endsWith('.png')||file.endsWith('.webm')||file.endsWith('.mov'));
  let directory = (browser=="Safari") ? "images/sprites/safari/" : "images/sprites/player/";
  if (!userIsDM) {
    // console.log("not dm");
    for (let index = 0; index < imageNames.length; index++) {
      createSpriteElement(directory + imageNames[index]);
    }
  }
}



function createSpriteElement(imageName) {
  buttons[imageName] = false;
  let imageButtonParent = document.createElement("th");
  imageButtonParent.setAttribute("class", "image-button-parent");
  imageContainer.appendChild(imageButtonParent);
  let imageButton = document.createElement("input");
  let imageButtonLabel = document.createElement("label");
  imageButton.setAttribute("type", "checkbox");
  imageButton.setAttribute("onclick", "checkMark(this)");
  //imageButton.setAttribute("checked", false);
  imageButton.setAttribute("id", imageName);
  imageButtonLabel.setAttribute("for", imageName);
  imageButtonParent.appendChild(imageButton);
  imageButtonParent.appendChild(imageButtonLabel);
  imageButtonLabel.setAttribute("class", "sprite-border");
  let image;
  if(imageName.endsWith('.webm')||imageName.endsWith('.mov')){
      image = document.createElement('video');
      image.preload = true;
      image.muted = true;
      image.loop = true;
      image.playsInline = true;
      image.autoplay = true;
  }
  else{
      image = document.createElement('img');
  }
  //let image = document.createElement('img');
  imageButtonLabel.appendChild(image);
  const imageTag = imageName;
  image.src = imageTag;
  image.setAttribute("class", "sprite");
}

function checkMark(button) {
  buttons[button.id] = button.checked;
  // console.log(button.id);
}

function submitChoices() {
  console.log("choices submitted!");
  console.log(spriteButtons);
  // submit which sprites the player has selected to control
  userControlled = [];
  let index = 0;
  for (let [key, value] of Object.entries(spriteButtons)) {
    console.log(value);
    if (value) {
      userControlled.push(index);
    }
    index++;
  }
  console.log(userControlled);
  document.getElementById("modal").setAttribute("style", "display:none");
}

function onRecieveSceneTransition(transitionInfo) {
  if (transitionInfo != null) {
    sceneTransLerpTime = transitionInfo.sceneTransLerpTime;
    sceneTransDirection = transitionInfo.sceneTransDirection;
    sceneTransStart = millis() - transitionInfo.sceneTransStart;
    sceneTransition = true;
  }
}

function broadcastSceneTransition() {
  let transitionInfo = {
    sceneTransDirection: sceneTransDirection,
    sceneTransLerpTime: sceneTransLerpTime,
    sceneTransStart: millis() - sceneTransStart
  };
  socket.emit('sceneTransition', transitionInfo);
}


function displayFPS() {
  frameTimes.push(deltaTime);
  if (millis() - timeCounter > 15000) {
    averageFps = frameTimes.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / frameTimes.length;
    frameTimes = [];
    timeCounter = millis();
  }

  textSize(16);
  if (averageFps > 0) {
    text((1000 / averageFps).toFixed(1), 15 - width / 2, 30 - height / 2);
  }
  else {
    text((1000 / deltaTime).toFixed(1), 15 - width / 2, 30 - height / 2);
  }
}

//console.log=sendErrorsToServer;
//window.onerror = sendErrorsToServer;

function sendErrorsToServer(event){
socket.emit("error", event);
}

navigator.saysWho = (() => {
  const { userAgent } = navigator
  let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []
  let temp

  if (/trident/i.test(match[1])) {
    temp = /\brv[ :]+(\d+)/g.exec(userAgent) || []

    return `IE ${temp[1] || ''}`
  }

  if (match[1] === 'Chrome') {
    temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(' ').replace('OPR', 'Opera')
    }

    temp = userAgent.match(/\b(Edg)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(' ').replace('Edg', 'Edge (Chromium)')
    }
  }

  match = match[2] ? [ match[1], match[2] ] : [ navigator.appName, navigator.appVersion, '-?' ]
  temp = userAgent.match(/version\/(\d+)/i)

  if (temp !== null) {
    match.splice(1, 1, temp[1])
  }

  return match
})();

new p5();
window.setup = setup;
window.draw  = draw;