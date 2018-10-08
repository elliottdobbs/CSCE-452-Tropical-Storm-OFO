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

class Robot {

  //tell the robot how many axes it will have
  constructor(axes) {
    this.angles = [];
    this.lengths = [];
    this.lengths_total = [];
    this.lengths_total.push(0);
    this.points = [];
    this.points.push(new Point(0, 0));
    this.colors = [];
    this.axes = axes;
    for(var i = 0; i < axes; i++) {
      this.angles.push(0);
      this.lengths.push(1);
      this.lengths_total.push(0);
      this.points.push(new Point(i + 1, 0));
      this.colors.push("#ff0000");
    }
  }

  //indices start at 0
  //angles in radians
  //lengths in pixels

  //dangle = delta angle...
  rotateAxis(index, dangle) {
    this.setAxisRotation(index, dangle + this.getAxisRotation(index));
  }

  getAxisRotation(index) {
    return this.angles[index];
  }

  setAxisRotation(index, angle) {
    var deltaAngle = angle - this.angles[index];
    this.angles[index] = angle;
    for(var i = index + 1; i <= this.axes; i++) {
      this.points[i].rotateAround(this.points[index], deltaAngle);
    }
  }

  getAxisLength(index) {
    return this.lengths[index];
  }

  setAxisLength(index, length) {
    if(length == 0) return;

    var deltaMagnitude = length / this.lengths[index];
    this.lengths[index] = length;

    var source = this.points[index];
    var delta = this.points[index + 1].copy();
    delta.scaleAround(source, deltaMagnitude);
    delta.translate(this.points[index + 1].negative());

    for(var i = index + 1; i <= this.axes; i++) {
      this.points[i].translate(delta);
    }

    for(var i = index; i <= this.axes; i++) {
      this.lengths_total[i + 1] = this.lengths_total[i] + this.lengths[i];
    }
  }

  getAxisBeginPoint(index) {
    return this.points[index];
  }

  getAxisEndPoint(index) {
    return this.points[index + 1];
  }

  getEndPoint() {
    return this.getAxisEndPoint(this.axes - 1);
  }

  draw(ctx) {
    ctx.lineWidth = 2;
    for(var i = 0; i < this.axes; i++) {
      var start = this.getAxisBeginPoint(i);
      var end = this.getAxisEndPoint(i);

      ctx.strokeStyle = this.colors[i];
      ctx.beginPath();

      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      ctx.stroke();
      ctx.closePath();

    }
  }

  
}