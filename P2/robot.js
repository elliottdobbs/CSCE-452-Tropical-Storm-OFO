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

class Robot {

  //tell the robot how many axes it will have
  constructor() {
    this.axes = 0;
    this.lengths = [];
    this.angles = [];
    this.colors = [];
    this.transforms = [];

    var _this = this;

    this.Options = {
      robot: _this,
      DeltaAngle: 5,
      DeltaX: 5,
      PaintColor: "#ffffff",
      PaintRadius: 5,
      Painting: false,
      Tracking: false,
      DrawBound: false,
      DrawReach: false,
      Dot: function() {
        drawDot(robot.getEndPoint());
      },
      "translate": function(x, y) {
        //TODO: translate robot
        this.robot.translate(x, y);
      },
      "X+": function() {
        this.translate(this.DeltaX, 0);
      },
      "X-": function() {
        this.translate(-this.DeltaX, 0);
      },
      "Y+": function() {
        this.translate(0, this.DeltaX);
      },
      "Y-": function() {
        this.translate(0, -this.DeltaX);
      },
    };
  }

  //indices start at 0
  //angles in radians
  //lengths in pixels

  addAxis(length, angle, color, gui) {
    length = length || 100;
    angle = angle || 0;
    color = color || "#ff0000";

    var index = this.axes;
    this.axes++;
    this.lengths.push(length);
    this.angles.push(angle);
    this.colors.push(color);
    this.transforms.push(this.getTransform(angle, length));

    if(gui) {
      this.fillOptions(index, gui.addFolder("Axis " + (index + 1)));
    }
    return index;
  }

  removeAxis(gui) {
    this.lengths.pop();
    this.angles.pop();
    this.colors.pop();
    this.transforms.pop();
    if(gui) {
      gui.removeFolder("Axis " + (this.axes));
    }
    this.axes--;
    return this.axes;
  }

  getTransform(angle, length) {
    var t = new Transform();
    t.rotate(angle);
    t.translate(length, 0);
    return t;
  }

  getT(index) {
    return this.transforms[index];
  }

  getTRange(from, to) {
    from = from || 0;
    if(to == undefined) to = this.axes;
    var t = new Transform();
    for(var i = from; i < to; i++) {
      t = t.multiply(this.transforms[i]);
    }
    return t;
  }

  totalLength() {
    return this.lengths.reduce((total, num) => total + num, 0);
  }

  //dangle = delta angle...
  rotateAxis(index, dangle) {
    this.setAxisRotation(index, dangle + this.getAxisRotation(index));
  }

  getAxisRotation(index) {
    return this.angles[index];
  }

  setAxisRotation(index, angle) {
    this.angles[index] = angle;
    this.transforms[index] = this.getTransform(angle, this.lengths[index]);
  }

  getAxisLength(index) {
    return this.lengths[index];
  }

  setAxisLength(index, length) {
    this.lengths[index] = length;
    this.transforms[index] = this.getTransform(this.angles[index], length);
  }

  translate(x, y) {
    var p = this.getEndPoint();
    this.goto(p.x + x, p.y + y);
  }

  goto(x, y) {
    var p = x;
    if(y != undefined) {
      p = new Point(x, y);
    }
    //current behavior: robot attempts to go towards boundary
    var m = p.magnitude();
    var len = this.totalLength();
    if(m > len) {
      p.scale(len / m);
    }

    var reach = [];
    for(var i = 0; i < this.axes; i++) {
      reach.push(this.lengths[i]);
    }
    reach.push(0);
    for(var i = this.axes - 2; i >= 0; i--) {
      reach[i] += reach[i + 1];
    }

    //get everything into reach
    for(var axis = 0; axis < this.axes; axis++) {
      var next_reach = reach[axis + 1];
      var start = this.getAxisBeginPoint(axis);
      var end = this.getAxisEndPoint(axis);
      var dist = p.distance(end);
      //first condition: make sure all arms are in range, but be lazy
      //second condition: make sure the last arm is exactly at the right position
      if((dist > next_reach) || (axis >= this.axes - 2)) {
        var delta = end.copy();
        delta.translate(start.negative());
        var delta_d = delta.magnitude();

        var angle_p = p.angleAround(start);
        var angle_end = end.angleAround(start);
        var dist = Angles.distance(angle_p, angle_end);

        var dist2 = p.distance(start);
        delta.scale(dist2 / delta.magnitude());
        var extra = delta.magnitude() - delta_d;
        var cos_dmod = (0 - (next_reach * next_reach) + (delta_d * delta_d) + (dist2 * dist2)) / (2 * delta_d * dist2);
        if(Math.abs(cos_dmod) <= 1) {
          dist -= Math.acos(cos_dmod);
        }

        if(Angles.less(angle_p, angle_end)) {
          this.rotateAxis(axis, -dist);
        } else {
          this.rotateAxis(axis, dist);
        }
      }
    }

    //move the last arm into position
  }

  getAxisBeginPoint(index) {
    var p = new Point();
    var t = this.getTRange(0, index);
    return t.apply(p);
  }

  getAxisEndPoint(index) {
    var p = new Point();
    var t = this.getTRange(0, index + 1);
    return t.apply(p);
  }

  getEndPoint() {
    return this.getAxisEndPoint(this.axes - 1);
  }

  getOptions(index) {
    var _this = this;
    var obj = {
      "level": index,
      "robot": _this,
      "RotateCW": function() {
        var from = this.robot.getAxisRotation(this.level);
        var incr = _this.Options.DeltaAngle * Math.PI / 180;
        this.robot.rotateAxis(this.level, incr);
      },
      "RotateCCW": function() {
        var from = this.robot.getAxisRotation(this.level);
        var incr = -_this.Options.DeltaAngle * Math.PI / 180;
        this.robot.rotateAxis(this.level, incr);
      },
      get Color() {
        return this.robot.colors[this.level];
      },
      set Color(color) {
        this.robot.colors[this.level] = color;
      },
      get Length() {
        return this.robot.getAxisLength(this.level);
      },
      set Length(length) {
        this.robot.setAxisLength(this.level, length);
      }
    };
    return obj;
  }

  //dat.gui helper
  fillOptions(index, folder) {
    var options = this.getOptions(index);
    folder.add(options, "RotateCW");
    folder.add(options, "RotateCCW");
    folder.addColor(options, "Color");
    folder.add(options, "Length", 1, 250);
  }

  addOptions(folder) {
    folder.add(this.Options, "Tracking");
    folder.add(this.Options, "Painting");
    folder.addColor(this.Options, "PaintColor");
    folder.add(this.Options, "PaintRadius", 1, 20);
    folder.add(this.Options, "DrawBound");
    folder.add(this.Options, "DrawReach");
    folder.add(this.Options, "DeltaAngle", 0, 90);
    folder.add(this.Options, "DeltaX", 0, 100);
    folder.add(this.Options, "X+");
    folder.add(this.Options, "X-");
    folder.add(this.Options, "Y+");
    folder.add(this.Options, "Y-");
  }

  draw(ctx, cursor) {
    ctx.lineWidth = 2;
    var lengths = [];
    for(var i = 0; i < this.axes; i++) {
      lengths.push(this.lengths[i]);
    }
    for(var i = this.axes - 2; i >= 0; i--) {
      lengths[i] += lengths[i + 1];
    }

    for(var i = 0; i < this.axes; i++) {
      var start = this.getAxisBeginPoint(i);
      var end = this.getAxisEndPoint(i);

      ctx.strokeStyle = this.colors[i];
      ctx.lineWidth = 2;
      ctx.beginPath();

      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      ctx.stroke();
      ctx.closePath();

      if(this.Options.DrawReach) {
        ctx.lineWidth = 1;
        ctx.beginPath();

        ctx.arc(start.x, start.y, lengths[i], 0, 2*Math.PI);

        ctx.stroke();
        ctx.closePath();
      }
    }
    this.drawDot(ctx, this.getEndPoint());
    //draw the boundary limit
    if(this.Options.DrawBound && !this.Options.DrawReach) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();

      ctx.arc(0, 0, this.totalLength(), 0, 2*Math.PI);

      ctx.stroke();
      ctx.closePath();
    }
  }

  //possibly draw new stuff on the painting canvas
  update(ctxP, cursor, mouseDown) {
    //follow le mouse ;)
    if(this.Options.Tracking) {
      this.goto(cursor);
    }

    var next_point = this.getEndPoint();
    var prev = this.prev_point;
    this.prev_point = next_point;

    var doDraw = this.Options.Painting || (this.Options.Tracking && mouseDown);
    if(!doDraw) return;

    ctxP.save();
    ctxP.translate(canvas.width / 2, canvas.height / 2);

    if(prev) {
      this.drawDot(ctxP, prev);
      this.drawDot(ctxP, next_point);
      this.drawLine(ctxP, prev, next_point);
    }

    ctxP.restore();
  }

  drawLine(ctxP, start, end) {
    //put a paint line on ctxP
    ctxP.save();

    ctxP.beginPath();
    ctxP.moveTo(start.x, start.y);
    ctxP.lineTo(end.x, end.y);
    ctxP.strokeStyle = this.Options.PaintColor;
    ctxP.lineWidth = this.Options.PaintRadius * 2;
    ctxP.stroke();
    ctxP.closePath();

    ctxP.restore();
  }

  drawDot(ctxP, p) {
    //put a paint dot on ctxP
    ctxP.save();

    ctxP.beginPath();
    ctxP.arc(p.x, p.y, this.Options.PaintRadius, 0,2*Math.PI);
    ctxP.fillStyle = this.Options.PaintColor;
    ctxP.fill();
    ctxP.closePath();

    ctxP.restore();
  }
  
}