//trololo
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

var Options = {
  Angle: 5,
  Drawing: false,
  ShowRobot: true,
  Background: "#000000",
  PaintColor: "#ffffff",
  PaintRadius: 5,
  Clear: function() {
    ctxP.clearRect(0, 0, canvas.width, canvas.height);
  },
  Dot: function() {
    drawDot(robot.getEndPoint());
  }
};

var robot = null;

//initialize everything
function start() {

  //TODO: configure other HTML or dat.gui things
  var gui = new dat.GUI();

  var f1 = gui.addFolder("Options");
  f1.add(Options, "Angle", 0, 90);
  f1.add(Options, "Drawing");
  f1.add(Options, "ShowRobot");
  f1.addColor(Options, "Background");
  f1.addColor(Options, "PaintColor");
  f1.add(Options, "PaintRadius", 1, 20);
  f1.add(Options, "Clear");
  f1.add(Options, "Dot");

  robot = new Robot(3);
  robot.setAxisLength(0, 150);
  robot.setAxisLength(1, 100);
  robot.setAxisLength(2, 75);
  robot.setAxisRotation(0, -Math.PI / 2);
  robot.colors[0] = "#ff0000";
  robot.colors[1] = "#00ff00";
  robot.colors[2] = "#0000ff";

  //for each axis
  for(var i = 0; i < 3; i++) {
    var folder = gui.addFolder("Axis " + (i + 1));
    var obj = {
      "level": i,
      "RotateCW": function(){
        var from = robot.getAxisRotation(this.level);
        var incr = Options.Angle * Math.PI / 180;
        if(Options.Drawing) drawArc(this.level, from, from + incr);
        robot.rotateAxis(this.level, incr);
      },
      "RotateCCW": function(){
        var from = robot.getAxisRotation(this.level);
        var incr = -Options.Angle * Math.PI / 180;
        if(Options.Drawing) drawArc(this.level, from, from + incr);
        robot.rotateAxis(this.level, incr);
      },
      get Color() {
        return robot.colors[this.level];
      },
      set Color(color) {
        robot.colors[this.level] = color;
      },
      get Length() {
        return robot.getAxisLength(this.level);
      },
      set Length(length) {
        robot.setAxisLength(this.level, length);
      },
      get Angle() {
        var angle = robot.getAxisRotation(this.level) * 180.0 / Math.PI;
        while(angle < -180) {
          angle += 360;
        }
        while(angle > 180) {
          angle -= 360;
        }
        return angle;
      },
      set Angle(angle) {
        var to = angle * Math.PI / 180.0;
        if(Options.Drawing) drawArc(this.level, robot.getAxisRotation(this.level), to);
        robot.setAxisRotation(this.level, to)
      }
    };
    folder.add(obj, "RotateCW");
    folder.add(obj, "RotateCCW");
    folder.addColor(obj, "Color");
    folder.add(obj, "Length", 1, 200);
    folder.add(obj, "Angle", -180, 180).listen();

    //TODO color changing for each axis
    //gui.addColor(Options, "color");
  }

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

    robot.draw(ctx);
  }

/*
  if(Options.Drawing) {
    drawDot(robot.getEndPoint());
  }
*/
}

function drawArc(level, angleFrom, angleTo) {
  ctxP.save();
  ctxP.translate(canvas.width / 2, canvas.height / 2);

  var offset = 0;
  for(var i = 0; i < level; i++) {
    offset += robot.getAxisRotation(i);
  }
  angleFrom += offset;
  angleTo += offset;

  ctxP.beginPath();
  var p = robot.getAxisBeginPoint(level);
  var radius = robot.getEndPoint().copy();
  radius.translate(p.negative());
  radius = radius.magnitude();
  if(angleFrom > angleTo) {
    var tmp = angleTo;
    angleTo = angleFrom;
    angleFrom = tmp;
  }
  ctxP.arc(p.x, p.y, radius, angleFrom, angleTo);
  ctxP.strokeStyle = Options.PaintColor;
  ctxP.lineWidth = Options.PaintRadius * 2;
  ctxP.stroke();
  ctxP.closePath();

  ctxP.restore();

  var p2 = p.copy();
  p2.translate(radius, 0);
  p2.rotateAround(p, angleFrom);
  drawDot(p2);
  p2.rotateAround(p, angleTo - angleFrom);
  drawDot(p2);
}

function drawDot(p) {
  //put a paint dot on ctxP
  ctxP.save();
  ctxP.translate(canvas.width / 2, canvas.height / 2);

  ctxP.beginPath();
  ctxP.arc(p.x, p.y, Options.PaintRadius, 0,2*Math.PI);
  ctxP.fillStyle = Options.PaintColor;
  ctxP.fill();
  ctxP.closePath();

  ctxP.restore();
}