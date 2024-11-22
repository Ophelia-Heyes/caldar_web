#ifdef GL_ES
precision mediump float;
#endif

// Pixel position
varying vec2 pos;

uniform float millis;
uniform float electroIntensity;
uniform vec3 effectPos;

// Uniforms set by filterShader
uniform sampler2D filter_background; // contains the image being filtered
uniform vec2 filter_res; // contains the image resolution in pixels



/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
vec3 random3(vec3 c) {
	float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
	vec3 r;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	return r-0.5;
}

/* skew constants for 3d simplex functions */
const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
	 /* 1. find current tetrahedron T and it's four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
	 
	 /* calculate s and x */
	 vec3 s = floor(p + dot(p, vec3(F3)));
	 vec3 x = p - s + dot(s, vec3(G3));
	 
	 /* calculate i1 and i2 */
	 vec3 e = step(vec3(0.0), x - x.yzx);
	 vec3 i1 = e*(1.0 - e.zxy);
	 vec3 i2 = 1.0 - e.zxy*(1.0 - e);
	 	
	 /* x1, x2, x3 */
	 vec3 x1 = x - i1 + G3;
	 vec3 x2 = x - i2 + 2.0*G3;
	 vec3 x3 = x - 1.0 + 3.0*G3;
	 
	 /* 2. find four surflets and store them in d */
	 vec4 w, d;
	 
	 /* calculate surflet weights */
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);
	 
	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, 0.0);
	 
	 /* calculate surflet components */
	 d.x = dot(random3(s), x);
	 d.y = dot(random3(s + i1), x1);
	 d.z = dot(random3(s + i2), x2);
	 d.w = dot(random3(s + 1.0), x3);
	 
	 /* multiply d by w^4 */
	 w *= w;
	 w *= w;
	 d *= w;
	 
	 /* 3. return the sum of the four surflets */
	 return dot(d, vec4(52.0));
}

float noise(vec3 m) {
    return   0.5333333*simplex3d(m)
			+0.2666667*simplex3d(2.0*m)
			+0.1333333*simplex3d(4.0*m)
			+0.0666667*simplex3d(8.0*m);
}

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

// vec2 rotate(vec2 v, float a){
//   float cs = cos(a);
//   float sn = sin(a);
//   vec2 vr;
//   vr.x = v.x *cs - v.y * sn;
//   vr.y = v.x * sn + v.y * cs;
//   return vr;
// }

float easeInCubic(float x)
{
return x * x * x;
}

vec2 rotateUV(vec2 uv, float rotation, vec2 mid)
{
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

void main( )
{
  vec2 uv = pos;// ((pos-.5)*4.)+.5;
  uv -= effectPos.xy;
  //uv -= vec2(.5,.1);
  uv.y *= filter_res.y/filter_res.x;
  //uv.y += .2;
  uv = uv * 2. -1.;  
  uv *=1.;
  // convert to polar coordinates
  vec2 uvAngle = normalize(uv);
  uv.y = length(uv)*2. - 1.;
  //uv.y *= uv.y*.5;
  uv.x = (atan(uvAngle.y, uvAngle.x)+1.)/(5.);
  
  //scale the effect with this vv
  uv.y += effectPos.z;
  
  vec2 p = pos;
  //vec2 p = uv;
  //p.y += 1.;
  vec3 p3 = vec3(p, millis*.001*0.4);    
  float intensity = noise(vec3(p3*16.+16.));
  
  float intensity2 = noise(vec3(p3*12.0+12.0));
                          
  float t = clamp((uv.x * -uv.x *.9) + 0.18, 0., 1.);    
  t = .1;
  float y = abs(intensity *- t + uv.y*.8);
    
  float g = pow(y, 0.2);
  float y2 = abs(intensity2 * -t + uv.y*.2);
  float g2 = pow(y2, .2);
  g= (g+g2)*.5;
                          
  vec3 col = vec3(1.70, 1.48, 1.78);
  col = col * -g + col;                    
  col = col * col;
  col = col * col;
  
  //col *= (sin(millis/1000.)+1.)*.5;
  //col *= 0.;
  
  // bulge effect
  vec2 dir = effectPos.xy - pos;
  dir += .5;
  float dist = length(dir);
  float d = dist - 0.05; // SDF of circle
  d *= 1. - smoothstep(0., 0.05, abs(d));
  dir = normalize(dir);
  float shading = d * 8.;
  
  // ripples
  float speed = 4.;
  speed = fract(millis/(1000.*speed));
  float rippleD = dist - speed;
  float ripple = sin(smoothstep(0., 0.5, abs(rippleD))*15.);
  ripple *= 1.-smoothstep(0., .5, abs(rippleD));
  // add falloff to beginning
  speed += 1.-smoothstep(.0, .1, speed);
  speed = clamp(speed, 0., 1.);
  ripple *= 1.- speed;
  // limit distance of ripples
  ripple *= 1.-smoothstep(0., .4,dist);
  
  
  float rotFalloff =  easeInCubic(1.-clamp(dist*15.,0.,1.));
  
  //uv = rotate(pos-effectPos.xy, sin(millis*.001)*rotFalloff)+effectPos.xy;
  uv = pos;
  
  float rotSpeed = millis*.001;
  
  vec2 rotatePos = rotateUV(pos, rotSpeed, effectPos.xy+.5)*7.-(effectPos.xy+.5);
  float rotNoise = noise(vec3(rotatePos,0.));
  
  rotNoise *= smoothstep(0.92, .99, 1.-dist);
  
  rotatePos = rotateUV(pos, rotSpeed, effectPos.xy+.5)-(effectPos.xy+.5);
  
  uv = mix(uv, rotatePos, rotNoise);
  
  vec3 tex = texture2D(filter_background, uv+dir*d+ripple*.004).xyz;
  tex += shading*(1.-electroIntensity);
  
  dist = length(effectPos.xy+.5-pos+rotNoise*.05);
  
  tex -= smoothstep(0.95, .99, 1.-dist);
  tex += col * electroIntensity;
  
  float ramp = pos.x;
  
  // Modified colour is our output
  gl_FragColor = vec4(vec3(tex), 1.);
  //gl_FragColor = texture2D(filter_background, rotatePos)+smoothstep(0.95, .99, 1.-dist);
}

