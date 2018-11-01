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

//math library stuff
/////////////////////////////////////////////////////////////////////////////////////////////////

var Angles = {
  TAU: 2 * Math.PI,
  fix: function(angle) {
    while(angle < 0) angle += this.TAU;
    while(angle > this.TAU) angle -= this.TAU;
    return angle;
  },
  distance: function(a1, a2) {
    a1 = this.fix(a1);
    return Math.min(Math.abs(a1 - a2), Math.abs(a1 - a2 + this.TAU), Math.abs(a1 - a2 - this.TAU));
  },
  //is a1 less than a2 (CW of it)?
  less: function(a1, a2) {
    var d = this.fix(a2 - a1);
    return d < Math.PI;
  }
};

function lawOfCosines(opposite, s1, s2) {
  return (-(opposite * opposite) + s1 * s1 + s2 * s2) / (2 * s1 * s2);
}

class Point {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  norm(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  magnitude() {
    return this.norm(this.x, this.y);
  }

  distance(p) {
    return this.norm(this.x - p.x, this.y - p.y);
  }

  copy() {
    return new Point(this.x, this.y);
  }

  negative() {
    return new Point(-this.x, -this.y);
  }

  translate(x, y) {
    if(y != undefined) {
      //x and y are numbers
      this.x += x;
      this.y += y;
    } else {
      //x is actually a point, y undefined
      this.x += x.x;
      this.y += x.y;
    }
  }

  scale(dm) {
    this.x *= dm;
    this.y *= dm;
  }

  scaleAround(p, dm) {
    this.translate(p.negative());
    this.scale(dm);
    this.translate(p);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  angleAround(p) {
    this.translate(p.negative());
    var ret = this.angle();
    this.translate(p);
    return ret;
  }

  rotate(dr) {
    var cos = Math.cos(dr);
    var sin = Math.sin(dr);
    var xP = cos * this.x - sin * this.y;
    var yP = sin * this.x + cos * this.y;
    this.x = xP;
    this.y = yP;
  }

  rotateAround(p, dr) {
    this.translate(p.negative());
    this.rotate(dr);
    this.translate(p);
  }
}

function transformRotationMatrix(angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  return math.matrix([
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1]
  ]);
}

//accepts single point or two numbers
function transformTranslationMatrix(x, y) {
  var dx = 0, dy = 0;
  if(y != undefined) {
    //x and y are numbers
    dx = x;
    dy = y;
  } else {
    //x is actually a point, y undefined
    dx = x.x;
    dy = x.y;
  }
  return math.matrix([
    [1, 0, dx],
    [0, 1, dy],
    [0, 0, 1]
  ]);
}

class Transform {
  constructor(matrix) {
    this.matrix = matrix || math.identity(3);
  }

  rotate(angle) {
    var rotation = transformRotationMatrix(angle)
    this.matrix = math.multiply(this.matrix, rotation);
  }

  //accepts single point or two numbers
  translate(x, y) {
    var translation = transformTranslationMatrix(x, y);
    this.matrix = math.multiply(this.matrix, translation);
  }

  frame(angle, x, y) {
    this.translate(x, y);
    this.rotate(angle);
  }

  multiply(t) {
    return new Transform(math.multiply(this.matrix, t.matrix));
  }

  inverse() {
    this.matrix = math.inv(this.matrix);
  }

  apply(p) {
    var pAsMatrix = math.matrix([[p.x], [p.y], [1]]);
    var result = math.multiply(this.matrix, pAsMatrix);
    return new Point(result._data[0][0], result._data[1][0]);
  }
}

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
  }

/////////////////////////////////////////////////////////////////////////////////////////////////
  //do other updating stuff right here

  //messy time delta calculations
  var ms = new Date().getTime();
  var delta_ms = ms - PREV_TICK_MS;
  var total_ms = ms - FIRST_TICK_MS;
  PREV_TICK_MS = ms;

  //reset the canvas
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

var world = null;
var robots = [];
var robotCount = 1;

canvas.addEventListener("click", function(evt){
                        console.log('Mouse Click');
                        world.addLightSource(getMousePos(evt), 100)
                        }, false);

var Options = {
  //put option variables (bools, numbers, or colors) here
MoveRobot: false,
Reset: function() {
    for (var i = 0; i < robots.length; i++){
        robots[i].setLocation(0, 0);
    }
},
ClearLights: function() {
    world.lights = [];
},
Robot_X: 0,
Robot_Y: 0,
Robot_Angle: 0,
Robot_Size: 100,
Robot_K11: 1,
Robot_K12: 0,
Robot_K21: 0,
Robot_K22: 1,
AddRobot: function() {
  var pos = new Point(this.Robot_X, this.Robot_Y);
  var mat = math.matrix([
    [this.Robot_K11, this.Robot_K12],
    [this.Robot_K21, this.Robot_K22]
  ]);
  var r = new Robot(pos, mat, this.Robot_Size, this.Robot_Angle * Math.PI / 180);
  robots.push(r);
  //add robot folder
  r.fillGuiOptions(robotCount++, this.gui);
},
RemoveRobot: function(robot, i) {
  if(i == undefined) {
    i = robots.indexOf(robot);
  }
  if(i < 0) return;
  robots.splice(i, 1);
  i--;
  this.gui.removeFolder(robot.name);
}
};

//initialize everything
function start() {

  //TODO: configure other HTML or dat.gui things
  var gui = new dat.GUI();
  Options.gui = gui;

  var f1 = gui.addFolder("Options");
  f1.add(Options, "MoveRobot");
  f1.add(Options, "Reset");
  f1.add(Options, "ClearLights");

/*
Robot_X: canvas.width / 2,
Robot_Y: canvas.height / 2,
Robot_Angle: 0,
Robot_Size: 100,
Robot_K11: 1,
Robot_K12: 0,
Robot_K21: 0,
Robot_K22: 1,
*/

  f1.add(Options, "Robot_X", -1000, 1000);
  f1.add(Options, "Robot_Y", -1000, 1000);
  f1.add(Options, "Robot_Angle", 0, 360);
  f1.add(Options, "Robot_Size", 20, 200);
  f1.add(Options, "Robot_K11");
  f1.add(Options, "Robot_K12");
  f1.add(Options, "Robot_K21");
  f1.add(Options, "Robot_K22");

  f1.add(Options, "AddRobot");

  world = new World();

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

  //everything gets centered on the screen
  ctx.translate(width / 2, height / 2);
    
    //Move robot

  //TODO: draw the point light sources (just draw a dot, I guess)
    for (var j = 0; j < world.lights.length; j++){
        ctx.save();
        ctx.beginPath();
        ctx.arc(world.lights[j].source.x, world.lights[j].source.y, 4, 0,2*Math.PI);
        ctx.fillStyle = "#ffff66";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

  //draw all the robots
  for(var i = 0; i < robots.length; i++) {
    var robot = robots[i];
    if(Options.MoveRobot) robot.update(world, deltaTime, totalTime);

    ctx.save(); //push
    robot.draw(ctx);
    ctx.restore(); //pop
    
    var w = canvas.width / 2;
    var h = canvas.height / 2;
    if(robot.location.distance(new Point()) > Math.sqrt(w * w + h * h)) {
      //robot out of bounds, remove
      Options.RemoveRobot(robot, i);
      i--;
    }
  }
}
