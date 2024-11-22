attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 pos;

void main() {
  pos = aTexCoord;
  pos.y = -pos.y+1.;
  
  vec4 position = vec4(aPosition, 1.);
  position.w = 1.;
  position.xy = position.xy * 2. - 1.;
  
  gl_Position = position;
}