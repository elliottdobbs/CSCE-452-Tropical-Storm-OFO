class Simulation {
  constructor(canvas) {
    this.canvas = canvas;

    //dat.gui stuff?

    this.mouseWasDown = false;

    this.field = new Rectangle(new Point(), 500, 500);
    this.field_local = new Rectangle(new Point(), 500, 500);
    this.selectRadius = 10;
    this.selected = 0;
    this.selected_start = -1;
    this.selected_end = -2;
    this.select_origin = null;

    this.boxes = [];
    this.addBox(200, 200);
    this.addBox(150, 150);
    this.addBox(100, 100);
    
    this.robotStart = this.getPoint();
    this.robotEnd = this.getPoint();

    //TODO: cell decomposition and path
    this.mp = new MotionPlanner();
    this.mp.update(this.field_local, this.robotStart, this.robotEnd, this.boxes);
  }

  addBox(width, height) {
    var limit = 100;
    var r;
    while(limit-- > 0) {
      var x = Utils.randomRange(0, this.field.width - width);
      var y = Utils.randomRange(0, this.field.height - height);
      r = new Rectangle(new Point(x, y), width, height);

      var works = true;
      for(var i = 0; i < this.boxes.length; i++) {
        if(this.boxes[i].intersects(r)) {
          works = false;
          break;
        }
      }
      if(works) break;
    }
    this.boxes.push(r);
  }

  getPoint() {
    var limit = 100;
    var p;
    while(limit-- > 0) {
      p = new Point(Utils.randomRange(0, this.field.width), Utils.randomRange(0, this.field.height));
      var works = true;
      for(var i = 0; i < this.boxes.length; i++) {
        if(this.boxes[i].contains(p)) {
          works = false;
          break;
        }
      }
      if(works) return p;
    }
    return p; //it tried, whatever
  }

  resize(width, height) {
    var window = new Rectangle(new Point(), width, height);
    RectanglePosition.center(window, this.field);
  }

  mouseClick(p) {
    //don't really care
  }

  mouseDown(p) {
    this.select_origin = p.copy();
    if(p.distance(this.robotStart) <= this.selectRadius) {
      this.selected = this.selected_start;
    } else if(p.distance(this.robotEnd) <= this.selectRadius) {
      this.selected = this.selected_end;
    } else {
      //try to select a box
      for(var i = 0; i < this.boxes.length; i++) {
        if(this.boxes[i].contains(p)) {
          this.selected = i + 1;
          break;
        }
      }
    }
  }

  mouseDrag(p) {
    var delta = p.copy();
    delta.subtract(this.select_origin);
    this.select_origin = p.copy();
    //translate selected
    if(this.selected == this.selected_start) {
      this.robotStart.translate(delta);
      var tmpRect = new Rectangle(this.robotStart, 0, 0);
      RectanglePosition.inside(this.field_local, tmpRect, 0);
    } else if(this.selected == this.selected_end) {
      this.robotEnd.translate(delta);
      var tmpRect = new Rectangle(this.robotEnd, 0, 0);
      RectanglePosition.inside(this.field_local, tmpRect, 0);
    } else if(this.selected > 0) {
      this.boxes[this.selected - 1].point.translate(delta);
      RectanglePosition.inside(this.field_local, this.boxes[this.selected - 1], 0);
    }
  }

  mouseUp(p) {
    this.mouseDrag(p);
    this.selected = 0;
  }

  //generic update function: to do logic and rendering later
  //width and height are supplied in pixels
  //ctx = canvas 2d rendering context (drawing API)
  //times are supplied in milliseconds
  updateAndRender(width, height, ctx, deltaTime, totalTime, cursor, mouseDown) {
    //this is where any constant-updating logic will happen
    //and also where we do the drawing

    //update

    var pathDirty = false;
    var cursor2 = cursor.copy();
    cursor2.subtract(this.field.point);
    if(mouseDown) {
      pathDirty = true;
      if(this.mouseWasDown) {
        this.mouseDrag(cursor2);
      } else {
        this.mouseDown(cursor2);
      }
    } else if(this.mouseWasDown) {
      pathDirty = true;
      this.mouseUp(cursor2);
    }
    this.mouseWasDown = mouseDown;

    //TODO: generate path
    if(pathDirty) {
      this.mp.update(this.field_local, this.robotStart, this.robotEnd, this.boxes);
    }

    //render

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ff0000";

    RenderHelper.drawRectangle(ctx, this.field);

    ctx.save();
    RenderHelper.clip(ctx, this.field.point, this.field.width, this.field.height);
    ctx.translate(this.field.point.x, this.field.point.y);

    //TODO: draw the motion planning constructs (cells, path)
    ctx.save();
    this.mp.render(ctx, this.field_local);
    ctx.restore();

    //start, end, obstacles
    for(var i = 0; i < this.boxes.length; i++) {
      RenderHelper.drawRectangle(ctx, this.boxes[i]);
    }
    ctx.fillStyle = "#00ff00";
    RenderHelper.drawDot(ctx, this.robotStart, 2);
    ctx.fillStyle = "#ff0000";
    RenderHelper.drawDot(ctx, this.robotEnd, 2);

    //selection highlighting
    if((this.selected == this.selected_start) || (this.selected == 0 && cursor2.distance(this.robotStart) <= this.selectRadius)) {
      ctx.fillStyle = "#00ff0080";
      RenderHelper.drawDot(ctx, this.robotStart, this.selectRadius);
    } else if((this.selected == this.selected_end) || (this.selected == 0 && cursor2.distance(this.robotEnd) <= this.selectRadius)) {
      ctx.fillStyle = "#ff000080";
      RenderHelper.drawDot(ctx, this.robotEnd, this.selectRadius);
    } else {
      //try to select a box
      ctx.fillStyle = "#0000ff80";
      for(var i = 0; i < this.boxes.length; i++) {
        if((this.selected == (i + 1)) || (this.selected == 0 && this.boxes[i].contains(cursor2))) {
          RenderHelper.fillRectangle(ctx, this.boxes[i]);
          break;
        }
      }
    }

    ctx.fillStyle = "#ffffff";
    RenderHelper.drawDot(ctx, cursor2, 1);

    ctx.restore();

/*
RenderHelper {
  drawRect(ctx, orig, width, height)
  drawCenteredRect(ctx, center, width, height, angle)
  drawLine(ctx, start, end)
  drawDot(ctx, p, r)
}
*/
  }
}
