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
  },
  lawOfCosines: function(opposite, s1, s2) {
    return (-(opposite * opposite) + s1 * s1 + s2 * s2) / (2 * s1 * s2);
  }
};

var Utils = {
  loopRange: function(x, max) {
    if(x < 0) {
      x %= max;
      x += max;
    }
    return x % max;
  },
  randomRange: function(min, max) {
    return min + Math.random() * (max - min);
  },
  randomRangeFloor: function(min, max) {
    return Math.floor(this.randomRange(min, max));
  },
  randomUnitPoint: function() {
    var p = new Point(1, 0);
    p.rotate(Math.random() * Math.PI * 2);
    return p;
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

  subtract(p) {
    this.translate(-p.x, -p.y);
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

  midpoint(p) {
    return new Point((this.x + p.x) / 2, (this.y + p.y) / 2);
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

class Rectangle {
  constructor(p, w, h) {
    this.point = p || new Point();
    this.width = w || 0;
    this.height = h || 0;
  }

  get center() {
    return new Point(this.point.x + (this.width / 2), this.point.y + (this.height / 2));
  }

  get minX() {
    return this.point.x;
  }

  get minY() {
    return this.point.y;
  }

  get maxX() {
    return this.point.x + this.width;
  }

  get maxY() {
    return this.point.y + this.height;
  }

  set center(p) {
    this.point = p.copy();
    this.point.x -= this.width / 2;
    this.point.y -= this.height / 2;
  }

  set minX(x) {
    this.point.x = x;
  }

  set minY(y) {
    this.point.y = y;
  }

  set maxX(x) {
    this.point.x = x - this.width;
  }

  set maxY(y) {
    this.point.y = y - this.height;
  }

  contains(p) {
    return (p.x >= this.minX) && (p.x <= this.maxX) && (p.y >= this.minY) && (p.y <= this.maxY);
  }

  distance(p) {
    var dx = Math.min(this.minX - p.x, 0, p.x - this.maxX);
    var dy = Math.min(this.minY - p.y, 0, p.y - this.maxY);
    return Math.sqrt(dx * dx + dy * dy);
  }

  //https://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
  //do the two rectangles intersect?
  intersects(r) {
    var c = this.center;
    var rc = r.center;
    var x = c.x;
    var y = c.y;
    var rx = rc.x;
    var ry = rc.y;
    return (Math.abs(x - rx) * 2 < (this.width + r.width))
      && (Math.abs(y - ry) * 2 < (this.height + r.height));
  }

  copy() {
    return new Rectangle(this.point.copy(), this.width, this.height);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
//rectangle positioning (for gui systems)
/////////////////////////////////////////////////////////////////////////////////////////////////

//ordering, arranging, and scaling boxes relative to eachother
var RectanglePosition = {
  align: function(outer, inner, funcs, padding) {
    padding = padding || 0;
    for(var i = 0; i < funcs.length; i++) {
      funcs[i](outer, inner, padding);
    }
  },
  inside: function(outer, inner, padding) {
    if(inner.minX < (outer.minX + padding)) {
      inner.minX = outer.minX + padding;
    }
    if(inner.minY < (outer.minY + padding)) {
      inner.minY = outer.minY + padding;
    }
    if(inner.maxX > (outer.maxX - padding)) {
      inner.maxX = outer.maxX - padding;
    }
    if(inner.maxY > (outer.maxY - padding)) {
      inner.maxY = outer.maxY - padding;
    }
  },
  fit: function(outer, inner) {
    var minScale = Math.min(outer.width / inner.width, outer.height / inner.height);
    inner.width *= minScale;
    inner.height *= minScale;
  },
  fill: function(outer, inner) {
    var maxScale = Math.max(outer.width / inner.width, outer.height / inner.height);
    inner.width *= maxScale;
    inner.height *= maxScale;
  },
  center: function(outer, inner) {
    inner.minX = outer.minX + (outer.width - inner.width) / 2;
    inner.minY = outer.minY + (outer.height - inner.height) / 2;
  },
  centerX: function(outer, inner) {
    inner.minX = outer.minX + (outer.width - inner.width) / 2;
  },
  centerY: function(outer, inner) {
    inner.minY = outer.minY + (outer.height - inner.height) / 2;
  },
  left: function(outer, inner, padding) {
    inner.minX = outer.minX + padding;
  },
  right: function(outer, inner, padding) {
    inner.maxX = outer.maxX - padding;
  },
  top: function(outer, inner, padding) {
    inner.maxY = outer.maxY - padding;
  },
  bottom: function(outer, inner, padding) {
    inner.minY = outer.minY + padding;
  },
  scale: function(outer, inner, padding, xScale, yScale) {
    if(xScale) {
      inner.width = outer.width * xScale;
    }
    if(yScale) {
      inner.height = outer.height * yScale;
    }
  },
  scaler: function(xScale, yScale) {
    return function(outer, inner, padding) {
      this.scale(outer, inner, padding, xScale, yScale);
    }.bind(this);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////
//IMAGES
/////////////////////////////////////////////////////////////////////////////////////////////////

class ImageStore {
  constructor(path) {
    this.path = path;
    this.imgCache = {};
  }

  getImage(name) {
    if(imgCache[name]) {
      return imgCache[name];
    } else {
      loadImage(name);
      return imgCache[name];
    }
  }

  loadImage(name, ext) {
    var img = new Image();
    ext = ext || ".png";
    img.src = this.path + name + ext;
    imgCache[name] = img;
//todo - make sure it's loaded before returning (and have async version)
  }

  drawImage(img, canvas, r, flipped) {
    if(flipped) this.drawImageFlipped(img, canvas, r);
    else canvas.drawImage(this.getImage(img), r.minX, r.minY, r.width, r.height);
  }

  drawImageFlipped(img, canvas, r) {
    canvas.save();
    canvas.translate(r.minX, r.maxY);
    canvas.scale(1, -1);
    canvas.drawImage(this.getImage(img), 0, 0, r.width, r.height);
    canvas.restore();
  }
}

var RenderHelper = {
  clip(ctx, orig, width, height) {
    ctx.beginPath();
    ctx.rect(orig.x, orig.y, width, height);
    ctx.clip();
    ctx.closePath();
  },
  drawRectangle(ctx, rect) {
    this.drawRect(ctx, rect.point, rect.width, rect.height);
  },
  drawRect(ctx, orig, width, height) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(orig.x, orig.y, width, height);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  },
  fillRectangle(ctx, rect) {
    this.fillRect(ctx, rect.point, rect.width, rect.height);
  },
  fillRect(ctx, orig, width, height) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(orig.x, orig.y, width, height);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  },
  drawCenteredRect(ctx, center, width, height, angle) {
    ctx.save();

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  },
  //ctx = canvas2d context, start = point, end = point
  drawLine(ctx, start, end) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  },
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
};