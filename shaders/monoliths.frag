precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))
float PI = 3.14159265359;
float TAU = 6.28318530718;

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float easeOutBounce(float x) {
    float n1 = 7.5625;
    float d1 = 2.75;
    if (x < 1.0 / d1) {
        return n1 * x * x;
    } else if (x < 2.0 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

vec3 boxSize = vec3(0.495, 1.0, 0.495);

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec3 col = vec3(0.0);
  float tt = fract(0.3 * u_time);
  
  vec3 camPos = vec3(0.0, 0.0, 5.5); 
  vec3 rayDir = normalize(vec3(uv, -1.0));
  
  // FIX 1: Start depth slightly forward (0.1) to avoid camera-plane artifacts
  float depth = 0.1; 
  vec3 p = vec3(0.0);
  vec3 offFinal = vec3(0.0);
  float yDim = 2.0 * boxSize.y;
  
  for(int numIter = 0; numIter < 50; numIter++) {
    p = camPos + depth * rayDir;
    
    // Global scene rotation
    p.xz *= rotation(TAU / 13.0);   
    p.yz *= rotation(-TAU / 6.0);
    p.y -= yDim * tt;

    vec2 cellID = floor(p.xz);
    vec2 localXZ = fract(p.xz) - 0.5;
    vec3 pRepeated = vec3(localXZ.x, p.y, localXZ.y);
    
    float d = 1e20;
    
    // Neighbor checking for the bounce offset
    for(float i = -1.0; i <= 1.0; i++) {
      for(float j = -1.0; j <= 1.0; j++) {
        // Pseudo-random hash for per-block timing
        float offFac = TAU * fract(sin(dot(cellID + vec2(i, j), vec2(12.9898, 78.233))) * 43758.5453);   
        
        float tStart = 0.5 * offFac / TAU;
        float tEnd = tStart + 0.50;
        float ttt = (tt > tEnd) ? 1.0 : (tt > tStart) ? 2.0 * (tt - tStart) : 0.0;
   
        vec3 off2 = vec3(0.0, -yDim * easeOutBounce(ttt), 0.0);
        float dd = sdBox(pRepeated - off2 - vec3(i, 0.0, j), boxSize);
       
        if(dd < d) {
          offFinal = off2;
          d = dd;
        }   
      }
    }
    
    depth += d;
    // FIX 2: Increased epsilon (0.01) to eliminate ring artifacts/surface acne
    if (d < 0.01 || depth > 50.0) break;
  }

  if (depth < 50.0) {
    // Re-calculate local hit point for texturing
    p = camPos + depth * rayDir;
    p.xz *= rotation(TAU / 13.0);   
    p.yz *= rotation(-TAU / 6.0);
    p.y -= yDim * tt;
    p.xz = fract(p.xz) - 0.5;
    p -= offFinal;

    vec2 side;
    float outline = 0.0;
    float star = 1.0;
    float s1 = 0.92;
    float s2 = 0.95;

    // Face detection for outlines and "star" pattern
    if(abs(p.x) <= boxSize.x && abs(p.y) <= boxSize.y) {
      side = p.xy;
      outline = smoothstep(s1 * boxSize.x, s2 * boxSize.x, abs(side.x)) + smoothstep(s1 * boxSize.y, s2 * boxSize.y, abs(side.y));
      vec2 star_uv = fract(4.0 * side) - 0.5;
      star = length(star_uv) - (0.2 + 0.1 * sin
