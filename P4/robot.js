//stuff written by Noe
function tanD(degrees) {
  return Math.tan(degrees * Math.PI / 180);
}
function sinD(degrees) {
  return Math.sin(degrees * Math.PI / 180);
}
function cosD(degrees) {
  return Math.cos(degrees * Math.PI / 180);
}
function atanD(ratio) {
  return (Math.atan(ratio) * 180 / Math.PI);
}

function inchesToMeters(i) {
  return i * 0.0254;
}

//miles per hour to meters per second
function MPHtoMPS(mph) {
  return mph * 0.44704;
}

function MPStoMPH(mps) {
  return mps / 0.44704;
}

function interpolate_num(part, begin, end) {
  return part * end + (1 - part) * begin;
}

function interpolate_point(part, begin, end) {
  return new Point(interpolate_num(part, begin.x, end.x), interpolate_num(part, begin.y, end.y));
}

//Represents a vehicle
class Robot {
    
  //TODO: will take arguments (initial position/orientation)
  constructor(pos, angle) {
    //inches
    this.g = 96.5;
    this.d = 30;

    //degrees, mph
    this.a = 0;
    this.v = 0;

    this.info = this.newInfo();

    this.pos = pos || new Point();
    this.angle = angle || 0;

    this.reset(true);
  }

  newInfo() {
    return {
      vfr: 0,
      vfl: 0,
      vbr: 0,
      vbl: 0,
      ar: 0,
      al: 0,
      v: 0
    };
  }

  newInfoWith(vfr, vfl, vbr, vbl, ar, al, v) {
    return {
      vfr: vfr,
      vfl: vfl,
      vbr: vbr,
      vbl: vbl,
      ar: ar,
      al: al,
      v: v
    };
  }

  newInfoFrom(info) {
    return {
      vfr: info.vfr,
      vfl: info.vfl,
      vbr: info.vbr,
      vbl: info.vbl,
      ar: info.ar,
      al: info.al,
      v: info.v
    };
  }

  newLog(time) {
    var entry = {
      time: time,
      pos: this.pos.copy(),
      angle: this.angle,
      info: this.info
    };
    return entry;
  }

  reset(logging, log) {
    this.logging = logging;
    this.log_begin = new Date();
    this.log_prev = new Date();
    this.log_read_index = 0;
    if(logging) {
      this.log = [this.newLog(0)];
    } else {
      this.log = log;
    }
  }

  update(deltaTime, totalTime) {

    if(this.logging) {

      //move the vehicle

      var ar = -this.a; //correct turning direction for screen
      var vfr = MPHtoMPS(this.v);
      var g = inchesToMeters(this.g);
      var d = inchesToMeters(this.d);

      //all in meters and seconds
      // the (expression || 0) prevents results from becoming NaN
      var r = (g / tanD(ar) + d) || 0;
      var omega = (vfr * sinD(ar) / g) || 0; // = vfr/((r-d)/cosD(ar)) alternate formula
      var al = atanD(g / (r + d)) || ar;
      var vfl = (omega * g / sinD(al)) || vfr;
      var vbr = (omega * (r - d)) || vfr;
      var vbl = (omega * (r + d)) || vfr;
      var v = (omega * r) || vfr;

      //convert back to mph
      this.info = {
        vfr: MPStoMPH(vfr),
        vfl: MPStoMPH(vfl),
        vbr: MPStoMPH(vbr),
        vbl: MPStoMPH(vbl),
        ar: -ar,
        al: -al,
        v: MPStoMPH(v)
      };

      this.angle += (omega * 180 / Math.PI) * deltaTime;
      var delta = new Point(MPStoMPH(v) * (1/3600) * deltaTime, 0);
      delta.rotate(this.angle * Math.PI / 180);
      this.pos.translate(delta);

      var log_current = new Date();
      if(log_current - this.log_prev >= 100) {
        this.log.push(this.newLog(log_current - this.log_begin));
      }
    } else {
      var log_current = new Date();
      var time = log_current - this.log_begin;
      var i = this.log_read_index;
      for(; i < this.log.length; i++) {
        var entry = this.log[i];
        if(entry.time > time) {
          break;
        } else if(i == this.log.length - 1) {
          //restart
          this.log_read_index = 0;
          this.log_begin = new Date();
          return; //lazy way wooo
        }
      }
      i--;
      this.log_read_index = i;
      var begin = this.log[i]; //entry = pos angle info
      var end = this.log[i + 1];
      var part = (time - begin.time) / (end.time - begin.time);

      var pos = interpolate_point(part, begin.pos, end.pos);
      var angle = interpolate_num(part, begin.angle, end.angle);
      var info = this.newInfo();
      info.vfr = interpolate_num(part, begin.info.vfr, end.info.vfr);
      info.vfl = interpolate_num(part, begin.info.vfl, end.info.vfl);
      info.vbr = interpolate_num(part, begin.info.vbr, end.info.vbr);
      info.vbl = interpolate_num(part, begin.info.vbl, end.info.vbl);
      info.ar = interpolate_num(part, begin.info.ar, end.info.ar);
      info.al = interpolate_num(part, begin.info.al, end.info.al);
      info.v = interpolate_num(part, begin.info.v, end.info.v);

      this.pos = pos;
      this.angle = angle;
      this.info = info;
    }
  }

  //draw the robot on the canvas for this frame
  draw(ctx, p) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
      
    var rectWidth = 200;
    var rectHeight = 100;
    var wheelWidth = 30;
    var wheelHeight = 15;
      
    //this.drawRect(ctx, new Point(p.x, p.y), rectWidth, rectHeight, this.angle);
  }

  //utilities

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
