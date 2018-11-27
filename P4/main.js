//TODO:
//everything

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

var sim;

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////


console.log('Initializing robot');

//Grab the HTML5 canvas reference from the html DOM
var canvas = document.getElementById("robotCanvas");
//The 2D canvas allows you to access the drawing API
var ctx = canvas.getContext("2d");

var canvases = [canvas];

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

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

function getMousePos(evt) {
  var rect = canvas.getBoundingClientRect();
  var p = new Point((evt.clientX - rect.left), canvas.height - (evt.clientY - rect.top));
  return p;
}
canvas.addEventListener('mousemove', function(evt) {
  THE_MOUSE = getMousePos(evt);
}, false);
canvas.addEventListener('mousedown', function(evt) {
  THE_MOUSE_DOWN = true;
}, false);
canvas.addEventListener('mouseup', function(evt) {
  THE_MOUSE_DOWN = false;
}, false);
canvas.addEventListener("click", function(evt){
  sim.mouseClick(getMousePos(evt));
}, false);

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
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

    sim.resize(PREV_WINDOW_WIDTH, PREV_WINDOW_HEIGHT);
  }

/////////////////////////////////////////////////////////////////////////////////////////////////

  //messy time delta calculations
  var ms = new Date().getTime();
  var delta_ms = ms - PREV_TICK_MS;
  var total_ms = ms - FIRST_TICK_MS;
  PREV_TICK_MS = ms;

/////////////////////////////////////////////////////////////////////////////////////////////////

  //reset the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); //save the current state of the rendering context

  //coords = up and right
  ctx.translate(0, canvas.height);
  ctx.scale(1, -1);

  ctx.save();
  //call another function, for cleanliness
  sim.updateAndRender(canvas.width, canvas.height, ctx, delta_ms / 1000, total_ms / 1000, THE_MOUSE, THE_MOUSE_DOWN);
  ctx.restore();

  ctx.restore(); //discard the modified state of the rendering context

/////////////////////////////////////////////////////////////////////////////////////////////////

  //run the update loop again
  requestAnimationFrame(update);
}

function start() {
  sim = new Simulation(canvas);

  update();
}

start();