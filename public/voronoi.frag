precision mediump float;

varying vec2 pos;

uniform float millis;

const int num_points = 225;
uniform vec3 points[num_points];

uniform float transition;

uniform sampler2D background;
uniform sampler2D foreground;
uniform vec2 effectCenter;
uniform float clicked;















//	Simplex 3D Noise 
//	by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}



















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

// old
float noise(vec3 m) {
    return   0.5333333*simplex3d(m)
			+0.2666667*simplex3d(2.0*m)
			+0.1333333*simplex3d(4.0*m)
			+0.0666667*simplex3d(8.0*m);
}

// new

// float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
// vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
// vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

// float noise(vec3 p){
//     vec3 a = floor(p);
//     vec3 d = p - a;
//     d = d * d * (3.0 - 2.0 * d);

//     vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
//     vec4 k1 = perm(b.xyxy);
//     vec4 k2 = perm(k1.xyxy + b.zzww);

//     vec4 c = k2 + a.zzzz;
//     vec4 k3 = perm(c);
//     vec4 k4 = perm(c + 1.0);

//     vec4 o1 = fract(k3 * (1.0 / 41.0));
//     vec4 o2 = fract(k4 * (1.0 / 41.0));

//     vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
//     vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

//     return o4.y * d.y + o4.x * (1.0 - d.y);
// }


// simple pseudorandom random function

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 hash2( vec2 p )
{
	// texture based white noise
	//return textureLod( iChannel0, (p+0.5)/256.0, 0.0 ).xy;
	
    // procedural white noise	
	return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec4 voronoi( in vec2 x )
{
    vec2 ip = floor(x);
    vec2 fp = fract(x);

    //----------------------------------
    // first pass: regular voronoi
    //----------------------------------
	vec2 mr = vec2(0);
  
    vec3 pos3 = vec3(pos.xy, 0.);
  
    int point;
    float multiplier;
    // set very large number
    float maxDist = 1000.0;
    float comparison;
    for(int i = 0; i < 225; i ++)
    {

        vec3 r = points[i] - pos3;
        float dmin = dot(r.xy,r.xy);
      
      // convert to math
      // essentially: if dmin<maxDist
      comparison = step(dmin,maxDist);
      // maxDist = dmin
      maxDist = dmin*comparison+dmin*(1.-comparison);
      // mr = r.xy
      mr = r.xy*comparison+mr*(1.-comparison);
      // multiplier = r.z
      multiplier = r.z*comparison+multiplier*(1.-comparison);

        // if( dmin<maxDist)
        // {
        //   maxDist = dmin;
        //   mr = r.xy;
        //   //point = i;
        //   multiplier = r.z;
        //   //multiplier = points[i].z;
        // }
    }
  //multiplier = mr.z;
      // // math to generate original position given point number
  float numPerRow = pow(float(num_points), .5);
  float p = multiplier;
  // // get original point position
  vec2 posOffset = vec2(mod(p, numPerRow)/(numPerRow-1.),                             floor(p/numPerRow)/(numPerRow-1.));
  // // get offset of current position
  posOffset = mr+pos-posOffset;
  //second pass
    maxDist = 1000.0;
    for(int i = 0; i < num_points; i ++)
    {
      vec2 r = points[i].xy - pos;
      if( dot(mr-r,mr-r)>0.00001)
      {
        maxDist = min(maxDist, dot(0.5*(mr+r), normalize(r-mr)));
      }
    }
  //multiplier = rand(pos);
  
    return vec4(maxDist, 1., posOffset);
}


vec3 andColor(int number){
  return fract(sin(vec3(number+1))*vec3(12.87877, 1.97, 20.747474));
}

float it= 23.0;

vec4 tex(vec3 p)
{
    float t = 0.5*(millis/1000.)+78.;   
    vec4 o = vec4(p.xyz,3.*sin(t*.1));
    vec4 dec = vec4 (1.0,0.9,0.1,0.15) + vec4(.06*cos(t*.1),0,0,.14*cos(t*.23));
    for(int i=0; i < 23; ++i) {
      o.xzyw = abs(o/dot(o,o)- dec);
    }
    return o;
}

float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}


vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
	return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 nebulaTexture(vec2 uv){
    //vec2 uv = pos;
    vec3 col = vec3(0);   
    float t= (millis/1000.)* .05;
    
	for(float i=0.; i<=1.; i+=1./16.)
    {
        float d = fract(i+t); // depth
        float s = 1.0*mix(5.,.5,d); // scale
        float f = d * smoothstep(1.,.9,d); //fade
        col+= tex(vec3(uv*s,i*4.)).xyz*f;
    }
    
    col/=16.;
    //col*=vec3(2.,1.0,0.1);
    col*=vec3(0.85,1.5,2.);
   	col=pow(col,vec3(.6 ));  
    
    // get star image
    vec2 texOffset = vec2(sin(millis/100000.), cos(millis/100000.*1.23124124))+vec2(sin(uv.y*10.)+1., sin(uv.x*15.)+1.)*.03;
    vec3 bg = texture2D(foreground, fract(uv+texOffset)).xyz;
    //col = blendOverlay(col, bg, .5);
    col = pow(col, vec3(1.3));
    col = mix(col, bg, .1);
    col += pow(bg+.25, vec3(5.))*.5;
  return col;
}


float easeInCubic(float x)
{
return x * x * x;
}

float easeOutExpo(float x) {
  
return ((x-1.) * 1.) + (1.-(x-1.)) * (1. - pow(2., -10. * x));
}

float easeInExpo(float x) {
return (1.-(x - 0.)) * 0. + (x - 0.)* pow(2., 10. * x - 10.);
}

float decayPattern(vec2 uv, vec2 center, float mag)
  {
  vec2 uv2 = uv + snoise(vec3(uv*10., 1.))*.2;
  float detail = snoise(uv.xyx*50.);
  float noiseScale = mix (1., 3., mag);
  float n = snoise(vec3(uv2*2.*noiseScale, 1.))*detail;
  uv2 = uv2+n*.2 -center;
  float d = length(uv2);
  d -= (n)*.3;
  float dist = smoothstep(mag, 0., d);
  n = abs(n);
  n = 1.-pow(n, dist*.4);
  
  return n*1.1;
}

// level is [0,5], assumed to be a whole number
vec3 rainbow(float level)
{
	/*
		Target colors
		=============
		
		L  x   color
		0  0.0 vec4(1.0, 0.0, 0.0, 1.0);
		1  0.2 vec4(1.0, 0.5, 0.0, 1.0);
		2  0.4 vec4(1.0, 1.0, 0.0, 1.0);
		3  0.6 vec4(0.0, 0.5, 0.0, 1.0);
		4  0.8 vec4(0.0, 0.0, 1.0, 1.0);
		5  1.0 vec4(0.5, 0.0, 0.5, 1.0);
	*/
	
	float r = float(level <= 2.0) + float(level > 4.0) * 0.5;
	float g = max(1.0 - abs(level - 2.0) * 0.5, 0.0);
	float b = (1.0 - (level - 4.0) * 0.5) * float(level >= 4.0);
	return vec3(r, g, b);
}

vec3 smoothRainbow (float x)
{
    float level1 = floor(x*6.0);
    float level2 = min(6.0, floor(x*6.0) + 1.0);
    
    vec3 a = rainbow(level1);
    vec3 b = rainbow(level2);
    
    return mix(a, b, fract(x*6.0));
}

float easeInSine(float x) {
  return 1. - cos((x * 3.1415) / 2.);
}

vec3 bandedRainbow(float d, float bands){

  
  float fade = easeInSine(mod(d*bands, 1.));
  float step = fract(floor(d*bands)/bands-millis*.0001);
  step = fract(d-millis*.0005);
  return normalize(smoothRainbow(step))*fade;
}



void main() {
  
  vec4 c = voronoi( 8.0*pos);
  // c.y contains two ints, one as the whole portion and one as the fraction
  vec2 id = hash2(vec2(c.y-fract(c.y)));
  //vec2 id = vec2(rand(vec2(c.y-fract(c.y))),
                 //rand(vec2(c.y-fract(c.y)+10000.)));
  
  float pointActive = fract(c.y)*10.;
  
  vec2 posOffset = c.zw*.5;

  posOffset = vec2(0.);
  
  // // math to generate original position given point number
  // float numPerRow = pow(float(num_points), .5);
  // // get original point position
  // vec2 posOffset = vec2(mod(c.z, numPerRow)/(numPerRow-1.),                             floor(c.y/numPerRow)/(numPerRow-1.));
  // // get offset of current position
  // posOffset = points[int(c.z)].xy-posOffset;
  
  // handle decay transition
  float decay1 = decayPattern(pos, effectCenter, transition);
  vec3 grain = random3(pos.xyx);
  grain *= noise(pos.xyx*30.);
  vec2 uv = mix(pos, effectCenter, decay1*grain.x);
  float decay2 = decayPattern(uv, effectCenter, transition);
  uv = mix(pos, effectCenter, decay2);
  decay2 = decayPattern(uv, effectCenter, transition);
  float kill = easeInExpo(transition);
  
  
  vec3 bg = texture2D(background, fract(uv-posOffset)).xyz;
  // add a little shading to background
  bg *= 1.-decay1*.5;
  
  vec3 fg = nebulaTexture(pos);
  
  vec3 col = vec3(mix(bg, fg, clamp(decay2+kill,0.,1.)));
  //vec3 col = vec3(mix(bg, fg, pos.x));
  //vec3 col = fg;
  
  //vec3 col = vec3(.5);
  
    //col = mix(col, id.xyx, .3);


	// isolines
    // float offsetX = (sin(pos.x * 8. + millis/400.) + 1.)/ 2.;
    // float offsetY = (sin(pos.y * 3. + millis/300.) + 1.)/ 2.;
    // vec3 glow = vec3(offsetX, 0., offsetY);
    // // glow
    // col += mix( glow, vec3(0.,0.,0.), smoothstep( 0.01, 0.18, c.x+.12 ) )*transition;
    // // lines
    // col = mix(col, vec3(1.*transition), (1.-smoothstep( 0.0001, 0.002, c.x ))*.6 );
  
//     float d = 1.-(c.x*20.);
  
//     vec3 rain = bandedRainbow(1.-(d), 10.);
//     rain *= easeInSine(d);
  
//   /// temporary!!! for testing!! fuck me!!
//     //float selectPt = float(c.z-50.==0.);
//     col *= 1.-pointActive;
  
//     col += rain*pointActive*.5;
    
  
	gl_FragColor = vec4(col,1.);
  //gl_FragColor = vec4(hash2(c.zz),1.,1.);
  
}
