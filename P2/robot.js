class Point {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
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
  }

  //indices start at 0
  //angles in radians
  //lengths in pixels

  addAxis(length, angle, color) {
    length = length || 100;
    angle = angle || 0;
    color = color || "#ff0000";

    var index = this.axes;
    this.axes++;
    this.lengths.push(length);
    this.angles.push(angle);
    this.colors.push(color);
    this.transforms.push(this.getTransform(angle, length));
    return index;
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

  draw(ctx) {
    ctx.lineWidth = 2;
console.log("DRAW");
    for(var i = 0; i < this.axes; i++) {
      var start = this.getAxisBeginPoint(i);
      var end = this.getAxisEndPoint(i);
console.log(JSON.stringify(start) + " " + JSON.stringify(end));

      ctx.strokeStyle = this.colors[i];
      ctx.beginPath();

      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      ctx.stroke();
      ctx.closePath();

    }
  }

  
}