//Represents a vehicle
class Robot {
    
  //TODO: will take arguments (initial position/orientation, K matrix, size?, color?)
  constructor(initialLoc, kMat, sideL, ang) {
    /*
     vars:
     K matrix (2x2)
     side length (assume it's a small square)
     center
     orientation (just a single angle, CCW off x-axis)

     also note that HTML5 canvas has Y+ downwards, so CCW will show up as CW on the actual screen
     so just do the math as you normally would, treating all the numbers the same
     but when it renders it'll all be upside-down :^)
    */
      
      this.location = initialLoc || new Point();
      this.KMatrix = kMat || math.identity(2);
      this.sideLength = sideL || 100;
      this.angle = ang || 0;
  }

  fillGuiOptions(id, gui) {
    var name = "Robot_" + id;
    this.name = name;

    var _this = this;
    var options = {
      robot: _this,
      Remove: function() {
        Options.RemoveRobot(this.robot);
      },
      get K11() {
        return this.robot.KMatrix._data[0][0];
      },
      set K11(k) {
        this.robot.KMatrix._data[0][0] = k;
      },
      get K12() {
        return this.robot.KMatrix._data[0][1];
      },
      set K12(k) {
        this.robot.KMatrix._data[0][1] = k;
      },
      get K21() {
        return this.robot.KMatrix._data[1][0];
      },
      set K21(k) {
        this.robot.KMatrix._data[1][0] = k;
      },
      get K22() {
        return this.robot.KMatrix._data[1][1];
      },
      set K22(k) {
        this.robot.KMatrix._data[1][1] = k;
      }
    };

    var folder = gui.addFolder(name);
    folder.closed = false;
    folder.add(options, "K11");
    folder.add(options, "K12");
    folder.add(options, "K21");
    folder.add(options, "K22");
    folder.add(options, "Remove");
  }

  //placeholders - to be figured out using transformations and such

  getCenterPosition() {
    return this.location;
  }
    
  setLocation(newx, newy){
    this.location.x = newx;
    this.location.y = newy;
  }

  getSensorLeftDelta() {
    return new Point(this.sideLength / 2, this.sideLength / 4);
  }

  getSensorLeftPosition() {
      //putting the left sensor on the edge of the square body, 1/4 the way left
      var p = this.location.copy();
      p.translate(this.getSensorLeftDelta());
      p.rotateAround(this.location, this.angle);
    return p;
  }

  getSensorRightDelta() {
    return new Point(this.sideLength / 2, -this.sideLength / 4);
  }

  getSensorRightPosition() {
      //putting the right sensor on the edge of the square body, 1/4 the way right
      var p = this.location.copy();
      p.translate(this.getSensorRightDelta());
      p.rotateAround(this.location, this.angle);
      return p;
  }

  getWheelLeftDelta() {
    return new Point(-this.sideLength / 2, this.sideLength / 2);
  }

  getWheelLeftPosition() {
      //putting the left wheel on the edge of the square body, 1/4 the way back
      var p = this.location.copy();
      p.translate(this.getWheelLeftDelta());
      p.rotateAround(this.location, this.angle);
      return p;
  }

  getWheelRightDelta() {
    return new Point(-this.sideLength / 2, -this.sideLength / 2);
  }

  getWheelRightPosition() {
      //putting the right wheel on the edge of the square body, 1/4 the way back
      var p = this.location.copy();
      p.translate(this.getWheelRightDelta());
      p.rotateAround(this.location, this.angle);
      return p;
  }

  update(world, deltaTime, totalTime) {
    //move the vehicle

    var brightnessLeft = world.calculateBrightness(this.getSensorLeftPosition());
    var brightnessRight = world.calculateBrightness(this.getSensorRightPosition());
      
    var bVec = math.matrix([
      [brightnessLeft],
      [brightnessRight]
    ]);
      
    //calculate wheel speed using the K matrix

    var wVec = math.multiply(this.KMatrix, bVec);

    var wLeft = wVec._data[0][0];
    var wRight = wVec._data[1][0];

    //calculate delta speed using whatever formula given wheel speed

    var d = this.sideLength / 2;
    var omega = (wRight - wLeft) / 2 / d;
    var R = d * (wRight + wLeft) / (wRight - wLeft);
    var v = (wRight + wLeft) / 2;

    //apply translation and rotation to vehicle

    var angle = this.angle + omega;
    var delta = new Point(v, 0);
    delta.rotate(angle);

    this.location.translate(delta);
    this.angle = angle;
  }

  //draw the robot on the canvas for this frame
  draw(ctx) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ff0000";

    ctx.translate(this.location.x, this.location.y);
    ctx.rotate(this.angle);
    ctx.translate(this.sideLength / 2, 0); //center on wheel axis center

    //this.drawDot(ctx, new Point(), 1);

    this.drawRect(ctx, new Point(), this.sideLength, this.sideLength, 0);
    
    this.drawSensor(ctx, this.getSensorLeftDelta(), this.sideLength / 15, 0);
    this.drawSensor(ctx, this.getSensorRightDelta(), this.sideLength / 15, 0);
      
    this.drawRect(ctx, this.getWheelLeftDelta(), this.sideLength / 5, this.sideLength / 10, 0);
    this.drawRect(ctx, this.getWheelRightDelta(), this.sideLength / 5, this.sideLength / 10, 0);
  }

  //utilities

  drawSensor(ctx, center, size, angle) {
    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    this.drawLine(ctx, new Point(), new Point(size, size));
    this.drawLine(ctx, new Point(), new Point(size, -size));

    ctx.restore();
  }

  drawRect(ctx, center, width, height, angle) {
    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.stroke();
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
