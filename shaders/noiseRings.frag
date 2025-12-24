precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

// --- SIMPLEX NOISE MATH ---
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

const float F3 = 0.3333333;
const float G3 = 0.1666667;

float simplex3d(vec3 p) {
     vec3 s = floor(p + dot(p, vec3(F3)));
     vec3 x = p - s + dot(s, vec3(G3));
     vec3 e = step(vec3(0.0), x - x.yzx);
     vec3 i1 = e*(1.0 - e.zxy);
     vec3 i2 = 1.0 - e.zxy*(1.0 - e);
     vec3 x1 = x - i1 + G3;
     vec3 x2 = x - i2 + 2.0*G3;
     vec3 x3 = x - 1.0 + 3.0*G3;
     vec4 w, d;
     w.x = dot(x, x);
     w.y = dot(x1, x1);
     w.z = dot(x2, x2);
     w.w = dot(x3, x3);
     w = max(0.6 - w, 0.0);
     d.x = dot(random3(s), x);
     d.y = dot(random3(s + i1), x1);
     d.z = dot(random3(s + i2), x2);
     d.w = dot(random3(s + 1.0), x3);
     w *= w;
     w *= w;
     d *= w;
     return dot(d, vec4(52.0));
}

#define NUM_RINGS 16.
float PI = 3.14159;
float TAU = 6.28318;

// --- MAIN LOOP ---
void main() {
    // Mapping gl_FragCoord and u_resolution
    vec2 uv = ( gl_FragCoord.xy - .5 * u_resolution.xy ) / u_resolution.y;
    vec3 col = vec3(0.);
    float tt = fract(.3 * u_time);
    
    for(float i = 1.; i <= NUM_RINGS; i++){
      float a = atan(uv.y, uv.x) + PI;   
      float rad = .2;
      
      // Noise deltas using u_time
      float nx = .12*simplex3d(vec3((10.*i)+rad*sin(TAU*tt - 5.*a), (10.*i)+rad*cos(TAU*tt - 5.*a), simplex3d(vec3(sin(a),cos(a),i))));
      float ny = .12*simplex3d(vec3((2.*i)+rad*sin(TAU*tt - 5.*a), (2.*i)+rad*cos(TAU*tt - 5.*a), simplex3d(vec3(sin(a),cos(a),i))));  

      float d = length(uv - vec2(-.4));
      float circSDF = abs(length(uv-vec2(nx*d*d,ny*d*d)) - .37); 

      col += d*.0008/abs(circSDF);
    }   
    
    gl_FragColor = vec4(col, 1.0);
}
