precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))
float PI = 3.14159265;
float TAU = 6.28318530;

// SDFs
float sdBoxFrame(vec3 p, vec3 b, float e) {
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;
    return min(min(
        length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
        length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
        length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

vec3 boxSize = vec3(0.49);
vec3 frameSize = vec3(0.5);

// The Core Scene Logic
void scene(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);  
    float tt = fract(u_time);
    
    // Camera moving through the tunnel
    vec3 camPos = vec3(0.0, 0.0, 4.5 - 2.0 * u_time); 
    vec3 rayDir = normalize(vec3(uv, -1.0));
    
    float depth = 0.0;
    float closest = 0.0;
    float d = 0.0;
    vec3 p = vec3(0.0);
    vec3 cID = vec3(0.0);

    for(int numIter = 0; numIter < 120; numIter++) { // Adjusted iterations for web stability
        p = camPos + depth * rayDir;

        // The Warp
        p.x = p.x + 1.5 * sin(p.z);
        p.y += (0.2 * abs(p.x * p.x));

        // Limited Domain Repetition
        float scale = 2.0;
        vec3 cellID = floor(scale * p + 0.5);

        // Tunnel cutout logic
        if (cellID.x > 0.0 && cellID.x <= 1.0) cellID.x = 2.0;
        if (cellID.x <= 0.0 && cellID.x >= -1.0) cellID.x = -2.0;
        if (cellID.y > 0.0 && cellID.y <= 1.0) cellID.y = 2.0;
        if (cellID.y <= 0.0 && cellID.y >= -1.0) cellID.y = -2.0;

        vec3 localP = (scale * p) - cellID;
          
        float box = sdBox(localP, boxSize);
        float frame = sdBoxFrame(localP, frameSize, 0.02);  
        d = min(box, frame);
        closest = step(0.0, box - frame);
        depth += d * 0.15; // Marching step

        if (d < 0.01 || depth > 20.0) { 
            cID = cellID;
            p = localP; // Save local P for texturing
            break;
        }
    }

    if (depth < 20.0) {
        if (closest == 0.0) { // On the box face
            vec3 q = abs(p);
            vec2 side = (q.x > q.y && q.x > q.z) ? p.yz : (q.y >= q.x && q.y > q.z) ? p.xz : p.xy;
            
            // Draw Stars on boxes
            vec2 star_uv = 8.0 * side;
            vec2 starID = floor(star_uv + 0.5);
            star_uv = star_uv - starID;
            float off = fract(323.23 * sin(cID.x + starID.x / 10.0) * 12.0 * sin(cID.y + starID.y / 10.0));
            float star_rad = 0.2 + 0.2 * sin(TAU * tt + TAU * off);
            float star = length(star_uv) - star_rad;
            col += smoothstep(0.0, -0.05, star); // Sharp star edges
        } else { // On the wireframe
            col = vec3(1.0);
        }
    }
    
    // Depth-based fog
    col = mix(1.5 * col, vec3(0.0), smoothstep(0.0, 8.0, depth));
    fragColor = vec4(col, 1.0);
}

void main() {
    vec4 color;
    scene(color, gl_FragCoord.xy);
    
    // Simple Smart AA check (Edge detection)
    // Note: fwidth is used here. If it causes issues, we can remove the AA pass.
    if (fwidth(length(color.rgb)) > 0.01) {
        vec4 extra;
        for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                if(i==0 && j==0) continue;
                scene(extra, gl_FragCoord.xy + vec2(i, j) / 3.0);
                color += extra;
            }
        }
        color /= 9.0;
    }
    
    gl_FragColor = color;
    }
}
