#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

float PI = 3.14159265;
float TAU = 6.28318530;

float sdBoxFrame( vec3 p, vec3 b, float e ) {
    p = abs(p)-b;
    vec3 q = abs(p+e)-e;
    return min(min(
        length(max(vec3(p.x,q.y,q.z), 0.0)) + min(max(p.x,max(q.y,q.z)),0.0),
        length(max(vec3(q.x,p.y,q.z), 0.0)) + min(max(q.x,max(p.y,q.z)),0.0)),
        length(max(vec3(q.x,q.y,p.z), 0.0)) + min(max(q.x,max(q.y,p.z)),0.0));
}

float sdBox( vec3 p, vec3 b ) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

vec3 boxSize = vec3(.49);
vec3 frameSize = vec3(.5);

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);  
    float tt = fract(0.4 * u_time);
    
    vec3 camPos = vec3(0.0, -1.0, 2.5); 
    // Safety: ensure normalization doesn't hit a zero vector
    vec3 rayDir = normalize(vec3(uv, -1.0));
  
    float dy, depth = 0.0;
    float closest = 0.0;
    vec3 p = vec3(0.0);
    vec3 cID = vec3(0.0);

    for(int numIter = 0; numIter < 120; numIter++){
        p = camPos + depth * rayDir;

        // Ray warping logic
        p.yz *= rotation(-PI/3.75);    
        
        // Safety Floor: Clamp to 0.001 instead of 0.0 to prevent pow(0, 3) issues on some GPUs
        float base = clamp(2.0 - length(p.xz), 0.001, 2.0);
        dy = base * base * base; // Manual cube is safer than pow()
        
        p.xz *= rotation(PI/2.0 * dy);
        p.y += dy;
        p.x -= tt;
        p.z += tt;
       
        // Domain Repetition
        float scale = 2.0;
        vec3 cellID = vec3(0.0);
        cellID.y = -2.0;
        // round() replacement
        cellID.xz = floor(scale * p.xz + 0.5);
        
        vec3 localP = (scale * p) - cellID;
        
        float box = sdBox(localP, boxSize);
        float frame = sdBoxFrame(localP, frameSize, 0.02);  
        float d = min(box, frame);
        closest = step(0.0, box - frame);
        
        depth += d * 0.05;
        if (d < 0.01 || depth > 20.0){ 
            cID = cellID;
            p = localP; // Store local P for the star texture
            break;
        }
    }

    if (depth < 20.0) {
        if (closest == 0.0){
            vec3 q = abs(p);
            vec2 side = (q.x > q.y && q.x > q.z) ? p.yz : (q.y >= q.x && q.y > q.z) ? p.xz : p.xy;
            bool stars = (q.y >= q.x && q.y > q.z);

            if (stars){
                vec2 star_uv = 8.0 * side;
                vec2 starID = floor(star_uv + 0.5);
                star_uv = star_uv - starID;
                
                float off_s = fract(323.23 * sin(cID.x + starID.x/10.0) * 12.0 * sin(cID.z + starID.y/10.0));
                float off_e = fract(323.23 * sin((cID.x + 2.0) + starID.x/10.0) * 12.0 * sin((cID.z - 2.0) + starID.y/10.0));
                float off = mix(off_s, off_e, tt);
                
                float star_rad = 0.2 + 0.2 * sin(TAU * tt + TAU * off);
                float star = length(star_uv) - star_rad;
                
                // Safety: fwidth check
                float edge = 0.02; 
                #ifdef GL_OES_standard_derivatives
                    edge = fwidth(star);
                #endif
                
                col += smoothstep(0.0, -edge, star);
                col *= 1.1 - 0.6 * dy;
            }
        } else {
            col = (vec3(1.0) * 1.1 - 0.6 * dy);
        }
    }
  
    gl_FragColor = vec4(col, 1.0);
}
