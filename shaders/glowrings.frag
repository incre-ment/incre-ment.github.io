precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

float PI = 3.14159256;
float TAU = 6.28318530;

// IQ Torus SDF
float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

// Robust Bounce Easing
float easeOutBounce(float x) {
    float n1 = 7.5625;
    float d1 = 2.75;
    if (x < 1.0 / d1) {
        return n1 * x * x;
    } else if (x < 2.0 / d1) {
        float x2 = x - 1.5 / d1;
        return n1 * x2 * x2 + 0.75;
    } else if (x < 2.5 / d1) {
        float x2 = x - 2.25 / d1;
        return n1 * x2 * x2 + 0.9375;
    } else {
        float x2 = x - 2.625 / d1;
        return n1 * x2 * x2 + 0.984375;
    }
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec3 col = vec3(0.0);  
  float tt = fract(0.3 * u_time); 
  vec3 camPos = vec3(0.0, 0.0, 3.0); 
  vec3 rayDir = normalize(vec3(uv, -0.7));
  
  float d, depth = 0.0;
  float glowTotal = 0.0;
  vec3 p = vec3(0.0);
 
  float MAX_DEPTH = 10.0;
  int NUM_STEPS = 80; // Fewer steps = less accumulation = darker/stabler
  float STEP_SIZE = MAX_DEPTH / float(NUM_STEPS);

  for(int i = 0; i < 80; i++) {
    p = camPos + depth * rayDir;
   
    p.y -= 0.7;
    p.z += 1.5;
    p.yz *= rotation(PI/3.0);
    p.xy *= rotation(tt * PI/2.0);

    p *= 3.0;   
    float clampVal = 5.0;
    vec2 cellID = clamp(floor(p.xy + 0.5), -clampVal, clampVal);
    vec3 lp = p;
    lp.xy = p.xy - cellID;
    
    float offFac = fract(142.23 * sin((200.0 + cellID.x) * 1.24 * (100.0 + cellID.y)));
    float tStart = 0.4 * offFac;
    float tEnd = tStart + 0.5;  
    float ttt = (tt < tStart) ? 0.0 : (tt > tEnd) ? 1.0 : (tt - tStart) / 0.5;
    
    float yDim = 7.0;
    vec3 fall = vec3(0.0, -yDim * easeOutBounce(ttt) + yDim * tt, 0.0);
    
    vec3 tp = lp - fall;
    tp.zy *= rotation(PI/2.0);
    d = sdTorus(tp, vec2(0.3, 0.01));    
    
    // REDUCED INTENSITY: 
    // We use a much smaller numerator and a larger safety floor
    float safeD = max(d, 0.04); 
    float glow_bit = 0.0001 / pow(safeD, 1.8); // 1.8 is a "softer" curve than 2.25
    
    glowTotal += glow_bit;
    depth += STEP_SIZE;
    
    // If we hit the torus, we stop, but we don't force it to white.
    if (d < 0.001) break;
  }
  
  // Use a tone-mapping style approach: 
  // This ensures the color stays between 0 and 1
  col = vec3(glowTotal);
  col = 1.0 - exp(-col * 2.0); // Simple exposure tone-mapping

  gl_FragColor = vec4(col, 1.0);
}
