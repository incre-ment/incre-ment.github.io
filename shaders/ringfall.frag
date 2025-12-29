precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float easeOutBounce(float x){
    float n1 = 7.5625;
    float d1 = 2.75;
    if (x < 1. / d1) return n1 * x * x;
    else if (x < 2. / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    else if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    else return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

void main() {
    // Standardizing UV coordinates for your engine
    vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
    
    vec3 col = vec3(0);  
    float tt = fract(.3 * u_time); 
    vec3 camPos = vec3(0., 0., 3.); 
    vec3 rayDir = normalize(vec3(uv, -.7));
    float depth = 0.0;
    float glowTotal = 0.0;
    
    for(int i = 0; i < 80; i++){
        vec3 p = camPos + depth * rayDir;
        p.y -= .7; p.z += 1.5;
        p.yz *= rotation(3.14159/3.0);
        p.xy *= rotation(tt * 3.14159/2.0);
        p *= 3.0;   
        vec2 cellID = clamp(round(p.xy), -5.0, 5.0);
        p.xy -= cellID;
        
        float offFac = fract(142.23 * sin((200. + cellID.x) * 1.24 * (100. + cellID.y)));
        float tStart = .4 * offFac;
        float tEnd = tStart + .5;  
        float ttt = (tt > tStart && tt < tEnd) ? 2.0 * (tt - tStart) : (tt < tStart) ? 0.0 : 1.0;
        
        vec3 fall = vec3(0., -7.0 * easeOutBounce(ttt) + 7.0 * tt, 0.0);
        p.zy *= rotation(3.14159/2.0);
        float d = sdTorus(p - fall, vec2(.3, .01));    
        
        glowTotal += 0.0004 / pow(max(d, 0.005), 2.25);
        depth += 0.1;
        if (d <= 0.01 || depth >= 10.0) break;
    }
    
    gl_FragColor = vec4(vec3(glowTotal), 1.0);
}
