class Panel {
  constructor(sim) {
    this.sim = sim;

    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }

  resize(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  contains(p) {
    return (p.x >= this.x && p.x < (this.x + this.width) && p.y >= this.y && p.y < (this.y + this.height));
  }

  //coordinates are in panel-relative system from now on:

  mouseClick(p) {
  }

  updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, mouseInside) {

    //draw bounding rectangle
    this.drawRect(ctx, new Point(), this.width, this.height);

    //draw a lil dot ;)
    if(mouseInside) {
      this.drawDot(ctx, cursor, 2);
    }
  }

  drawRect(ctx, orig, width, height) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(orig.x, orig.y, width, height);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }

  drawCenteredRect(ctx, center, width, height, angle) {
    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }

  drawTriangle(ctx, center, size, angle) {
    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.scale(size, size);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 1);
    ctx.lineTo(2, 0);
    ctx.lineTo(0, -1);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }

  //ctx = canvas2d context, start = point, end = point
  drawLine(ctx, start, end) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }

  //ctx = canvas2d context, p = point
  drawDot(ctx, p, r) {
    //put a paint dot on ctx
    ctx.save();

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }
}

//TODO: draw the race track and car position and such
class PanelRaceTrack extends Panel {
    
  constructor(sim) {
    super(sim);
      
    //sim.robot.pos = new Point(0, 0);
      
    this.img = new ImageStore("");
    this.img.loadImage("Charlotte");
    this.racetrack_bounds = new Rectangle(new Point(), 1000, 600);
    
  }

  resize(x, y, width, height) {
    super.resize(x, y, width, height);
    var bounds = new Rectangle(new Point(), width, height);
    RectanglePosition.align(bounds, this.racetrack_bounds, [RectanglePosition.fit, RectanglePosition.center], 0);
  }

  mouseClick(p) {
  }

  updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, mouseInside) {
    //super.updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, mouseInside);
    
    this.img.drawImage("Charlotte", ctx, this.racetrack_bounds, true);

    var ppm = (295 / 1000 * 5280);
    var milesW = 1000 / ppm;
    var milesH = 600 / ppm;
    var pixelsPerMileW = this.racetrack_bounds.width / milesW;
    var pixelsPerMileH = this.racetrack_bounds.height / milesH;
    var rPos = sim.robot.pos.copy();

    rPos.x *= pixelsPerMileW;
    rPos.y *= pixelsPerMileH;
    rPos.translate(this.racetrack_bounds.point.x, this.racetrack_bounds.point.y);

    ctx.fillStyle = "#ff0000";
    this.drawDot(ctx, rPos, 3);
    this.drawTriangle(ctx, rPos, 3, sim.robot.angle * Math.PI / 180);

    ctx.save();
    //ctx.translate(-this.racetrack_bounds.point.x, -this.racetrack_bounds.point.y);
    //ctx.scale(pixelsPerMileW, pixelsPerMileH);

    var log = sim.robot.log;
    for(var i = 0; i < log.length; i++) {
      var pos = log[i].pos;
      pos = new Point(pos.x, pos.y);
      pos.x *= pixelsPerMileW;
      pos.y *= pixelsPerMileH;
      pos.translate(this.racetrack_bounds.point.x, this.racetrack_bounds.point.y);
      if(i <= sim.robot.log_read_index) ctx.fillStyle = "#0000ff";
      else ctx.fillStyle = "#ff0000";
      this.drawDot(ctx, pos, 1);
    }

    ctx.restore();

    //available helpers:
    //this.drawRect(ctx, center, width, height)
    //this.drawCenteredRect(ctx, center, width, height, angle)
    //this.drawLine(ctx, start, end)
    //this.drawDot(ctx, p, r)
  }
}

//TODO: draw the race car
class PanelRaceCar extends Panel {
  constructor(sim) {
    super(sim);
      
    this.img = new ImageStore("");
    this.img.loadImage("Charlotte");
    this.racetrack_bounds = new Rectangle(new Point(), 1000, 600);
  }

  resize(x, y, width, height) {
    super.resize(x, y, width, height);
    var bounds = new Rectangle(new Point(), width, height);
    RectanglePosition.align(bounds, this.racetrack_bounds, [RectanglePosition.fit, RectanglePosition.center], 0);
  }

  mouseClick(p) {
  }

  updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, mouseInside) {
    //super.updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, mouseInside);

    ctx.translate(this.width / 2, this.height / 2);

    var zoom = 40;

    var ppm = (295 / 1000 * 5280);
    var milesW = 1000 / ppm;
    var milesH = 600 / ppm;
    var pixelsPerMileW = this.racetrack_bounds.width / milesW; //should be the same as below ->
    var pixelsPerMileH = this.racetrack_bounds.height / milesH;
    var rPos = sim.robot.pos.copy();
    rPos.x *= pixelsPerMileW;
    rPos.y *= pixelsPerMileH;
    rPos.translate(this.racetrack_bounds.point.x, this.racetrack_bounds.point.y);

    ctx.scale(zoom, zoom);
    ctx.translate(-rPos.x, -rPos.y);

    this.img.drawImage("Charlotte", ctx, this.racetrack_bounds, true);
    ctx.translate(rPos.x, rPos.y);

    ctx.fillStyle = "#ff0000";
    ctx.strokeStyle = "#ff0000";

    var milesPerInch = (1 / 5280) * (1 / 12);
    ctx.scale(milesPerInch * pixelsPerMileW, milesPerInch * pixelsPerMileW);
    var angleRad = this.sim.robot.angle * Math.PI / 180;
    ctx.rotate(angleRad);
    ctx.lineWidth = 2;

    var L = this.sim.robot.g;
    var W = this.sim.robot.d * 2;
    var l2 = L / 2;
    var w2 = W / 2;
    var l_w = l2 / 1.5;
    var w_w = w2 / 2;

    this.drawDot(ctx, new Point(), 4);
    ctx.translate(l2, 0);

    var info = this.sim.robot.info;
    this.drawCenteredRect(ctx, new Point(), L, W, 0);
    this.drawCenteredRect(ctx, new Point(l2, -w2), l_w, w_w, -info.al * Math.PI / 180);
    this.drawCenteredRect(ctx, new Point(l2, w2), l_w, w_w, -info.ar * Math.PI / 180);
    this.drawCenteredRect(ctx, new Point(-l2, -w2), l_w, w_w, 0);
    this.drawCenteredRect(ctx, new Point(-l2, w2), l_w, w_w, 0);

    //available helpers:
    //this.drawRect(ctx, center, width, height)
    //this.drawCenteredRect(ctx, center, width, height, angle)
    //this.drawLine(ctx, start, end)
    //this.drawDot(ctx, p, r)
  }
}

class DrivingWidget {
  //min max velocity, min max angle
  constructor(minV, maxV, minA, maxA) {
    this.minV = minV;
    this.maxV = maxV;
    this.minA = minA;
    this.maxA = maxA;

    var size = 0.1;
    this.partNegative = (minV < 0) ? size : 0;
    this.partZero = this.partNegative + size;

    this.bounds = new Rectangle();

    this.steering_rate = 2.5;
  }

  mouseClick(p) {
    var pX = p.x / this.bounds.width;
    var pY = p.y / this.bounds.height;
    var vel = 0;
    pX = (Math.pow(Math.abs(pX * 2 - 1), this.steering_rate) * Math.sign(pX - 0.5) + 1) / 2;
    var angle = (this.maxA - this.minA) * pX + this.minA;

    if(pY < this.partNegative) {
      var part = pY / this.partNegative;
      vel = this.minV - part * this.minV;
    } else if(pY < this.partZero) {
      //var part = (pY - this.partNegative) / (this.partZero - this.partNegative);
      //vel = 0;
    } else {
      var part = (pY - this.partZero) / (1 - this.partZero);
      vel = part * this.maxV;
    }

    return {v: vel, a: angle};
  }

  updateAndRender(ctx, v, a, drawRect, drawLine, drawDot) {

    //draw some boxes
    var yNegative = this.bounds.height * this.partNegative;
    var yZero = this.bounds.height * this.partZero;
    if(yNegative > 0) {
      ctx.strokeStyle = "#ff0000";
      drawRect(ctx, new Point(), this.bounds.width, yNegative);
    }
    ctx.strokeStyle = "#ffffff";
    drawRect(ctx, new Point(0, yNegative), this.bounds.width, yZero - yNegative);
    ctx.strokeStyle = "#00ff00";
    drawRect(ctx, new Point(0, yZero), this.bounds.width, this.bounds.height - yZero);
    
    //draw a dot where (a, v) is

    var x = (a - this.minA) / (this.maxA - this.minA);
    x = (Math.pow(Math.abs(x * 2 - 1), 1/this.steering_rate) * Math.sign(x - 0.5) + 1) / 2;
    var y = (this.partZero + this.partNegative) / 2; //put 'er right in the middle
    ctx.fillStyle = "#ffffff";
    if(v < 0) {
      ctx.fillStyle = "#ff0000";
      y = ((this.minV - v) / this.minV) * this.partNegative;
    } else if(v > 0) {
      ctx.fillStyle = "#00ff00";
      y = (v / this.maxV) * (1 - this.partZero) + this.partZero;
    }
    drawDot(ctx, new Point(x * this.bounds.width, y * this.bounds.height), 2);
  }
}

//TODO: info display, car control widget
class PanelOptions extends Panel {
  constructor(sim) {
    super(sim);

    this.widget = new DrivingWidget(-5, 200, -30, 30);
    this.display = new Rectangle();
  }

  resize(x, y, width, height) {
    super.resize(x, y, width, height);
    var xOff = 15;
    var yOff = xOff;
    this.widget.bounds = new Rectangle(new Point(xOff, height / 2 + yOff), width - xOff * 2, height / 2 - yOff * 2);
    this.display = new Rectangle(new Point(xOff, yOff), width - xOff * 2, height / 2 - yOff * 2)
  }

  mouseClick(p) {
    if(this.widget.bounds.contains(p)) {
      var params = this.widget.mouseClick(new Point(p.x - this.widget.bounds.point.x, p.y - this.widget.bounds.point.y));
      //params = {velocity, angle}
      this.sim.robot.v = params.v;
      this.sim.robot.a = params.a;
    }
  }

  updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, mouseInside) {
    //super.updateAndRender(ctx, deltaTime, totalTime, cursor, mouseDown, false);

    //shortcut
    if(mouseDown && mouseInside) {
      this.mouseClick(cursor);
    }

    var robot = this.sim.robot;
    var info = robot.info;

    ctx.save();
    ctx.translate(this.widget.bounds.point.x, this.widget.bounds.point.y);
    this.widget.updateAndRender(ctx, info.vfr, info.ar, this.drawRect, this.drawLine, this.drawDot);
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    this.drawRect(ctx, this.display.point, this.display.width, this.display.height);
    ctx.save();

    ctx.beginPath();
    ctx.rect(this.display.point.x, this.display.point.y, this.display.width, this.display.height);
    ctx.clip();
    ctx.closePath();

    var dy = 28;
    ctx.font = "24px Arial";
    ctx.textBaseline="top"; 
    ctx.translate(this.display.point.x, this.display.point.y + this.display.height);
    ctx.scale(1, -1);
    ctx.translate(10, 10);

    ctx.fillText("VfR: " + info.vfr.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("VfL: " + info.vfl.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("VbR: " + info.vbr.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("VbL: " + info.vbl.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("aR: " + info.ar.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("aL: " + info.al.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("V: " + info.v.toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("Sec: " + (((new Date()) - robot.log_begin) / 1000).toFixed(4), 0, 0);
    ctx.translate(0, dy);
    ctx.fillText("Max: " + ((robot.log[robot.log.length - 1].time) / 1000).toFixed(4), 0, 0);

    ctx.restore();

    //available helpers:
    //this.drawRect(ctx, center, width, height)
    //this.drawCenteredRect(ctx, center, width, height, angle)
    //this.drawLine(ctx, start, end)
    //this.drawDot(ctx, p, r)
  }
}

class Simulation {
  constructor(canvas) {
    this.canvas = canvas;

    this.layout = {
      split_vertical: 0,
      split_horizontal: 0,
      right_pane_size: 300
    };

    this.panels = {
      upper_left: new PanelRaceTrack(this),
      lower_left: new PanelRaceCar(this),
      right: new PanelOptions(this)
    };
    this.panels_list = [
      this.panels.upper_left,
      this.panels.lower_left,
      this.panels.right
    ];

    //0.32, 0.32 = finish line
    this.robot = new Robot(new Point(0.320, 0.320), 180);

    //dat.gui stuff
    var gui = new dat.GUI({autoPlace: true});
    gui.domElement.id = "gui"; //https://stackoverflow.com/a/25716044
    gui.add(this, "Reset");
    gui.add(this, "Replay");
    gui.add(this, "Save");
    gui.add(this, "Load");
  }

  resize(width, height) {
    this.layout.split_vertical = height / 2;
    this.layout.split_horizontal = width - this.layout.right_pane_size;

    this.panels.upper_left.resize(0, this.layout.split_vertical, this.layout.split_horizontal, height - this.layout.split_vertical);
    this.panels.lower_left.resize(0, 0, this.layout.split_horizontal, this.layout.split_vertical);
    this.panels.right.resize(this.layout.split_horizontal, 0, this.layout.right_pane_size, height);
  }

  toPanelCoords(p, panel) {
    return new Point(p.x - panel.x, p.y - panel.y);
  }

  mouseClick(p) {
    for(var i = 0; i < this.panels_list.length; i++) {
      var panel = this.panels_list[i];
      if(panel.contains(p)) {
        panel.mouseClick(this.toPanelCoords(p, panel));
      }
    }
  }

  //generic update function: to do logic and rendering later
  //width and height are supplied in pixels
  //ctx = canvas 2d rendering context (drawing API)
  //times are supplied in milliseconds
  updateAndRender(width, height, ctx, deltaTime, totalTime, cursor, mouseDown) {
    //this is where any constant-updating logic will happen
    //and also where we do the drawing

    //update

    this.robot.update(deltaTime, totalTime);
	
    //render

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ff0000";

    //tmp stuff just for fun :^)
    var colors = ["#ff0000", "#00ff00", "#0000ff"];

    //draw three separate panes: upper left (race track), lower left (car), right (options)

    for(var i = 0; i < this.panels_list.length; i++) {
      var panel = this.panels_list[i];

      //tmp stuff
      ctx.strokeStyle = colors[i];
      ctx.fillStyle = colors[i];

      ctx.save();
      ctx.translate(panel.x, panel.y);
      ctx.beginPath();
      ctx.rect(0, 0, panel.width, panel.height);
      ctx.clip();
      ctx.closePath();

      ctx.save();
      panel.updateAndRender(ctx, deltaTime, totalTime, this.toPanelCoords(cursor, panel), mouseDown, panel.contains(cursor));
      ctx.restore();

      ctx.restore();
    }
  }

  //dat.gui hooks

  Reset() {
    this.robot = new Robot(new Point(0.320, 0.320), 180);
  }

  Replay() {
    this.robot.reset(false, this.robot.log);
  }

  //https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
  Save() {
    var data = JSON.stringify(this.robot.log);
    var type = "application/json";
    var filename = "robot_log.json";
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
  }

  Load() {
    //?
    var input = document.createElement("input");
    input.type = "file";
    document.body.appendChild(input);
    input.click();

    var this_ = this;
    input.onchange = function(evt) {
      if(input.files.length == 1) {
        var files = input.files;
        var file = files[0]; //we can only use 1 log file...

        var fr = new FileReader();
        fr.onloadend = function(e) {
          if(fr.result) {
            try {
              var data = JSON.parse(fr.result);
              this_.robot.reset(false, data);
            } catch(err) {
              alert("Syntax error.");
            }
          } else {
            alert("Error reading file.");
          }
        };

        fr.readAsText(file);
      } else if(input.files.length > 1) {
        alert("Please select just one file.");
      }
      //wait until after files are selected
      setTimeout(function() {
          document.body.removeChild(input);
      }, 0); 
    };
  }
}
