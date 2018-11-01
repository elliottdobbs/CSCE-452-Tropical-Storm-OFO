class Light {
  constructor(source, strength) {
    this.source = source;
    this.strength = strength;
  }

  calculateBrightness(p) {
    var d = this.source.distance(p);
    //assignment implies it's inversely proportional to d
    //however, we may use d*d instead (inversely proportional to square of distance)
    return this.strength / d;
  }
}

//Represents the state of the world (where the light sources are)
class World {
  constructor() {
    this.lights = [];
  }

  addLightSource(p, strength) {
    this.lights.push(new Light(p, strength));
  }

  calculateBrightness(p) {
    var brightness = 0;
    for(var i = 0; i < this.lights.length; i++) {
      brightness += this.lights[i].calculateBrightness(p);
    }
    return brightness;
  }
}
