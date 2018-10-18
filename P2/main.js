//TODO:
//fix issue where robot misses some configurations :T

//dat.gui polyfill courtesy of: https://stackoverflow.com/a/15851156
dat.GUI.prototype.removeFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
}

console.log('Initializing robot');

//Grab the HTML5 canvas reference from the html DOM
var canvas = document.getElementById("robotCanvas");
//The 2D canvas allows you to access the drawing API
var ctx = canvas.getContext("2d");

//same for painting
var canvasP = document.getElementById("paintCanvas");
var ctxP = canvasP.getContext("2d");

//same for bg
var canvasBG = document.getElementById("bgCanvas");
var ctxBG = canvasBG.getContext("2d");

var canvases = [canvas, canvasP, canvasBG];

//used to keep track of page size and make sure the canvas fits properly
var PREV_WINDOW_WIDTH = 0;
var PREV_WINDOW_HEIGHT = 0;
//used to keep track of system timing (in milliseconds)
var FIRST_TICK_MS = new Date().getTime();
var PREV_TICK_MS = FIRST_TICK_MS;

//mouse input
//http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
var THE_MOUSE = new Point();
var THE_MOUSE_DOWN = false;

function getMousePos(evt) {
  var rect = canvas.getBoundingClientRect();
  var p = new Point(evt.clientX - rect.left, evt.clientY - rect.top);
  p.translate(-canvas.width / 2, -canvas.height / 2);
  return p;
}
canvas.addEventListener('mousemove', function(evt) {
  var mousePos = getMousePos(evt);
  THE_MOUSE = mousePos;
}, false);
canvas.addEventListener('mousedown', function(evt) {
  THE_MOUSE_DOWN = true;
}, false);
canvas.addEventListener('mouseup', function(evt) {
  THE_MOUSE_DOWN = false;
}, false);

/////////////////////////////////////////////////////////////////////////////////////////////////

function update() {

  //resize the canvas to fit the window perfectly
  if(PREV_WINDOW_WIDTH != window.innerWidth || PREV_WINDOW_HEIGHT != window.innerHeight) {
    PREV_WINDOW_WIDTH = window.innerWidth;
    PREV_WINDOW_HEIGHT = window.innerHeight;
    for(var i = 0; i < canvases.length; i++) {
      canvases[i].width = window.innerWidth;
      canvases[i].height = window.innerHeight;
    }
    ctxP.clearRect(0, 0, canvasP.width, canvasP.height);
  }

/////////////////////////////////////////////////////////////////////////////////////////////////
  //do other updating stuff right here

  //messy time delta calculations
  var ms = new Date().getTime();
  var delta_ms = ms - PREV_TICK_MS;
  var total_ms = ms - FIRST_TICK_MS;
  PREV_TICK_MS = ms;

  //reset the canvas
  ctxBG.fillStyle=Options.Background;
  ctxBG.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); //save the current state of the rendering context

  //call another function, for cleanliness
  updateAndRender(canvas.width, canvas.height, ctx, delta_ms, total_ms);

  ctx.restore(); //discard the modified state of the rendering context

/////////////////////////////////////////////////////////////////////////////////////////////////

  //run the update loop again
  requestAnimationFrame(update);
}

var robot = null;

var Options = {
  ShowRobot: true,
  Background: "#000000",
  Clear: function() {
    ctxP.clearRect(0, 0, canvas.width, canvas.height);
  },
  ArmLength: 50,
  ArmColor: "#c0c0c0",
  AddArm: function() {
    robot.addAxis(this.ArmLength, 0, this.ArmColor, this.gui);
  },
  RemoveArm: function() {
    robot.removeAxis(this.gui);
  }
};

//initialize everything
function start() {

  //TODO: configure other HTML or dat.gui things
  var gui = new dat.GUI();
  Options.gui = gui;

  var f1 = gui.addFolder("Options");
  f1.add(Options, "ShowRobot");
  f1.addColor(Options, "Background");
  f1.add(Options, "Clear");
  f1.add(Options, "ArmLength", 1, 200);
  f1.addColor(Options, "ArmColor");
  f1.add(Options, "AddArm");
  f1.add(Options, "RemoveArm");

  robot = new Robot();
  robot.addOptions(gui.addFolder("Painting"));
  robot.addAxis(150, -Math.PI / 2, "#ff0000", gui);
  robot.addAxis(100, 0, "#00ff00", gui);
  robot.addAxis(75, 0, "#0000ff", gui);

  //initial call to the update function to get things going
  update();
}

start();

/////////////////////////////////////////////////////////////////////////////////////////////////

//generic update function: to do logic and rendering later
//width and height are supplied in pixels
//ctx = canvas 2d rendering context (drawing API)
//times are supplied in milliseconds
function updateAndRender(width, height, ctx, deltaTime, totalTime) {
  //this is where any constant-updating logic will happen
  //and also where we do the drawing

  //robot gets centered on the screen
  ctx.translate(width / 2, height / 2);

  if(Options.ShowRobot) {
    //draw the painting tip of the robot
    ctx.beginPath();
    var p = robot.getEndPoint();
    ctx.arc(p.x, p.y, Options.PaintRadius, 0,2*Math.PI);
    ctx.fillStyle = Options.PaintColor;
    ctx.fill();
    ctx.closePath();

    robot.draw(ctx, THE_MOUSE);
  }

  robot.update(ctxP, THE_MOUSE, THE_MOUSE_DOWN);
}