precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

float PI = 3.14159265;
float TAU = 6.28318530;

float dot2(in vec3 v) { return dot(v,v); }

// Box Frame SDF by IQ
float sdBoxFrame(vec3 p, vec3 b, float e) {
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;
    return sqrt(min(min(dot2(max(vec3(p.x, q.y, q.z), 0.0)),
                    dot2(max(vec3(q.x, p.y, q.z), 0.0))),
                    dot2(max(vec3(q.x, q.y, p.z), 0.0)))) 
           + min(0.0, min(min(max(p.x, max(q.y, q.z)),
                          max(p.y, max(q.z, q.x))),
                          max(p.z, max(q.x, q.y))));
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

const float dim = 0.25;
vec3 boxSize = vec3(0.95 * dim);
vec3 frameSize = vec3(dim);

struct sdfData {
    float closest;
    float dist;
};

sdfData SDF(vec3 p, vec2 cellID, float tt) {
    sdfData sdf;
    float minVal_Box = 1e20;
    float minVal_Frame = 1e20;
  
    float yTop = floor(6.0 * hash12(cellID));
    float yBot = floor(6.0 * hash12(2.43 * cellID));
    float cellOff = hash12(cellID);
    tt = fract(tt + cellOff);
   
    float bWidth = 2.0 * dim;
    float gapDelta = 9.0 * bWidth;

    vec3 motion;
    if (p.y < 0.0) {
        motion = vec3(0.0, tt * bWidth, 0.0);
        for(float y = 0.0; y <= 6.0; y++) {
            if(y > yBot) break;
            vec3 offset = -vec3(0.0, (gapDelta + dim) - y * bWidth, 0.0);
            minVal_Box = min(minVal_Box, sdBox(p - offset + motion, boxSize));
            minVal_Frame = min(minVal_Frame, sdBoxFrame(p - offset + motion, frameSize, 0.008));     
        }
    } else {
        motion = vec3(0.0, tt * bWidth, 0.0);
        for (float y = 0.0; y <= 6.0; y++) {
            if(y > yTop - 1.0) break;
            vec3 offset = vec3(0.0, (gapDelta - dim) - y * bWidth, 0.0);
            minVal_Box = min(minVal_Box, sdBox(p - offset + motion, boxSize));
            minVal_Frame = min(minVal_Frame, sdBoxFrame(p - offset + motion, frameSize, 0.008));
        }
    }
   
    motion = vec3(0.0, tt * tt * (2.0 * gapDelta - (yTop + yBot) * bWidth), 0.0); 
    vec3 offset = vec3(0.0, (gapDelta - dim) - yTop * bWidth, 0.0);
    minVal_Box = min(minVal_Box, sdBox(p - offset + motion, boxSize));
    minVal_Frame = min(minVal_Frame, sdBoxFrame(p - offset + motion, frameSize, 0.008));
   
    sdf.dist = min(minVal_Box, minVal_Frame);
    sdf.closest = step(0.0, minVal_Box - minVal_Frame);
    return sdf;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);   
    float fracTime = fract(0.2 * u_time);
    
    vec3 camPos = vec3(0.0, 0.0, 4.5); 
    vec3 rayDir = normalize(vec3(uv, -1.0)); 
    
    float depth = 0.0;
    vec3 p = vec3(0.0);
    float closest = 0.0;
    sdfData sdf;
    
    for(int numIter = 0; numIter < 60; numIter++) {
        p = camPos + depth * rayDir;
        p.yz *= rotation(-PI / 6.0);
        p.xz *= rotation(-PI / 4.7);
        p.xy *= rotation(-PI / 6.5);

        // Standard Domain Repetition (No p.xz += offset)
        vec2 cellID = floor(p.xz);
        vec3 pRep = p;
        pRep.xz = fract(p.xz) - 0.5;

        float minVal = 1e20;
        // Checking neighbors ensures blocks don't pop out at cell boundaries
        for(float xx = -1.0; xx <= 1.0; xx++) {
            for(float zz = -1.0; zz <= 1.0; zz++) {
                vec2 cID = cellID + vec2(xx, zz);  
                sdf = SDF(pRep - vec3(xx, 0.0, zz), -cID, fracTime); 
                if (sdf.dist < minVal) {
                    minVal = sdf.dist;
                    closest = sdf.closest;
                }
            }
        }
        depth += minVal;
        // If rings appear, increase 0.005 to 0.01
        if (minVal < 0.005 || depth > 15.0) break;
    }
  
    if (depth < 15.0) {
        // Aesthetic lighting: focus on the edges (closest) with a depth-based falloff
        col = closest * vec3(60.0 * pow(1.0 - depth/30.0, 12.0) * (3.5 - abs(p.y)));
    }

    gl_FragColor = vec4(col, 1.0);
}
