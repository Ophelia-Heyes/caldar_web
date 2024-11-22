#ifdef GL_ES
precision mediump float;
#endif

// Pixel position
varying vec2 pos;

// Uniforms set by filterShader
uniform sampler2D filter_background; // contains the image being filtered
uniform vec2 filter_res; // contains the image resolution in pixels

uniform float noise; // set from p5 sketch

void main() {  
  // Calculate offset based on noise value
  vec2 offset = vec2(noise * 0.05, 0.);
  
  // Read pixel colour with offset
  vec3 col;
  col.r = texture2D(filter_background, pos + offset).r;
  col.g = texture2D(filter_background, pos).g;
  col.b = texture2D(filter_background, pos - offset).b;
  
  // Modified colour is our output
  gl_FragColor = vec4(col, 1.);
}