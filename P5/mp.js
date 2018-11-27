function close_enough(a, b) {
  var e = 0.0001;
  return Math.abs(a - b) < e;
}

function adjacent(r1, r2) {
  if(close_enough(r1.minX, r2.minX)) return (close_enough(r1.minY, r2.maxY) || close_enough(r2.minY, r1.maxY));
  if(close_enough(r1.minY, r2.minY)) return (close_enough(r1.minX, r2.maxX) || close_enough(r2.minX, r1.maxX));
  return false;
}

class MotionPlanner {
  constructor() {
    this.cells = [];
    this.connections = [];
    this.path = [];
  }

  update(field, start, end, boxes) {

    //preparing stuff
    var cells_per_side = boxes.length * 2 + 1;
    var cells = [];
    var xs = [0, field.width];
    var ys = [0, field.height];
    for(var i = 0; i < boxes.length; i++) {
      xs.push(boxes[i].minX);
      xs.push(boxes[i].maxX);
      ys.push(boxes[i].minY);
      ys.push(boxes[i].maxY);
    }
    xs.sort(function(a, b){return a - b});
    ys.sort(function(a, b){return a - b});

    //create all cells
    for(var cell_x = 0; cell_x < cells_per_side; cell_x++) {
      for(var cell_y = 0; cell_y < cells_per_side; cell_y++) {
        var cell_num = cell_x + cell_y * cells_per_side;
        var cell_x_min = xs[cell_x];
        var cell_x_max = xs[cell_x + 1];
        var cell_y_min = ys[cell_y];
        var cell_y_max = ys[cell_y + 1];
        var cell = new Rectangle(new Point(cell_x_min, cell_y_min), cell_x_max - cell_x_min, cell_y_max - cell_y_min);
        cells.push(cell);
      }
    }

    //remove blocked cells, and zero-area cells (borders)
    cells = cells.filter(function(box) {
      if(box.width == 0 || box.height == 0) return false;
      var c = box.center;
      for(var i = 0; i < boxes.length; i++) {
        if(boxes[i].contains(c)) return false;
      }
      return true;
    });
    this.cells = cells;

    //connect cells (form graph)
    var connections = [];
    for(var i = 0; i < cells.length; i++) {
      var c1 = cells[i];
      for(var j = 0; j < cells.length; j++) {
        if(i == j) continue;
        var c2 = cells[j];
        if(adjacent(c1, c2)) {
          connections.push([i, j]);
          connections.push([j, i]);
        }
      }
    }
    this.connections = connections;

    //find which cells are the starting and ending cells
    var cell_start = -1;
    var cell_end = -1;
    for(var i = 0; i < cells.length; i++) {
      if(cells[i].contains(start)) cell_start = i;
      if(cells[i].contains(end)) cell_end = i;
    }
    if(cell_start < 0 || cell_end < 0) {
      this.path = [];
      this.path_points = [];
      return;
    }

    //do a graph search
    //this computes a backwards bfs, then traces it back to get a path
    var frontier = [cell_end];
    var sources = {};
    sources[cell_end] = -1;
    while(frontier.length > 0) {
      var cell_current = frontier.pop();
      if(cell_current == cell_start) {
        break;
      }
      for(var i = 0; i < connections.length; i++) {
        var conn = connections[i];
        if(conn[1] == cell_current) {
          var cell_next = conn[0];
          if(sources[cell_next] == undefined) {
            sources[cell_next] = cell_current;
            frontier.unshift(cell_next);
          }
        }
      }
    }

    if(sources[cell_start] == undefined) {
      this.path = [];
      this.path_points = [];
      return;
    }

    //reconstruct path
    var path = [];
    var path_points = [start];
    for(var cell_current = cell_start; cell_current >= 0;) {
      path.push(cell_current);
      path_points.push(this.cells[cell_current].center);
      cell_current = sources[cell_current];
    }
    path_points.push(end);
    this.path = path;
    this.path_points = path_points;
  }

  render(ctx, field) {
    ctx.lineWidth = 1;
    var color1 = "#404040";
    var color2 = "#303030";
    ctx.strokeStyle = color1;
    ctx.fillStyle = color2;
    var this_ = this;

    this.cells.forEach(cell => {
      ctx.strokeStyle = color1;
      RenderHelper.drawRectangle(ctx, cell)
      //ctx.strokeStyle = color2;
      //RenderHelper.drawLine(ctx, new Point(cell.minX, cell.minY), new Point(cell.maxX, cell.maxY));
    });

/*
    ctx.strokeStyle = color2;
    this.connections.forEach(connection => {
      var c1 = this_.cells[connection[0]].center;
      var c2 = this_.cells[connection[1]].center;
      RenderHelper.drawLine(ctx, c1, c2);
    });
*/

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0000a0";
    for(var i = 0; i < this.path_points.length - 1; i++) {
      RenderHelper.drawLine(ctx, this.path_points[i], this.path_points[i + 1]);
    }
  }
}