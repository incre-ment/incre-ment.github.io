precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

float PI = 3.14159256;
float TAU = 6.28318;

// Thanks IQ!
float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

// easings.net
float easeOutBounce(float x){
    float n1 = 7.5625;
    float d1 = 2.75;
    if (x < 1. / d1) {
        return n1 * x * x;
    } else if (x < 2. / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
  vec3 col = vec3(0);  
  float tt = fract(.3 * u_time); 
  vec3 camPos = vec3(0., 0., 3.); 
  vec3 rayDir = normalize(vec3(uv, -.7));
  
  float d = 0.0;
  float depth = 0.0;
  float glowTotal = 0.0;
  vec3 p = vec3(0);
 
  float MAX_DEPTH = 10.;
  const int NUM_STEPS = 120; // Optimized down from 500 for browser stability
  float STEP_SIZE = MAX_DEPTH / float(NUM_STEPS);

  for(int i = 0; i < NUM_STEPS; i++){
    p = camPos + depth * rayDir;
   
    // Total Scene Translations
    p.y -= .7;
    p.z += 1.5;
    
    // Total Scene Rotations
    p.yz *= rotation(PI/3.);
    p.xy *= rotation(tt * PI/2.);

    // Clamped Domain Repetition
    p *= 3.;   
    float clampVal = 5.;
    vec2 cellID = clamp(round(p.xy), -clampVal, clampVal);
    p.xy = p.xy - cellID;
    
    // Fall start offset calculation
    float offFac = fract(142.23 * sin((200. + cellID.x) * 1.24 * (100. + cellID.y)));
    
    // Timing 
    float tStart = .4 * offFac;
    float tEnd = tStart + .5;  
    float ttt;
    if (tt > tStart && tt < tEnd){
      ttt = 2.0 * (tt - tStart);
    }
    else if (tt < tStart) ttt = 0.;
    else ttt = 1.;
    
    // Vertical Motion
    float yDim = 7.0;
    vec3 fall = vec3(0., -yDim * easeOutBounce(ttt) + yDim * tt, 0.);
    
    // Torus Orientation, SDF, and Glow
    p.zy *= rotation(PI/2.);
    d = sdTorus(p - fall, vec2(.3, .01));    
    
    // The "Glow" math
    float glow_bit = 0.0004 / pow(max(d, 0.001), 2.25);
    glowTotal += glow_bit;
    
    depth += STEP_SIZE;
    if (d <= 0.01 || depth >= MAX_DEPTH) break;
  }
  
  if (depth >= MAX_DEPTH) {
      col = vec3(glowTotal);
  } else {
      col = vec3(1.0 + glowTotal); // Mix solid hits with glow
  }
  
  gl_FragColor = vec4(col, 1.0);
}
