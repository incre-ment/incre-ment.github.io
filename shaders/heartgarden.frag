precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

float PI = 3.14159256;
float TAU = 6.28318512;

float dot2(in vec2 v) { return dot(v,v); }

// Heart SDF from IQ
float sdHeart(in vec2 p) {
    p.x = abs(p.x);
    if( p.y+p.x > 1.0 )
        return sqrt(dot2(p-vec2(0.25,0.75))) - sqrt(2.0)/4.0;
    return sqrt(min(dot2(p-vec2(0.00,1.00)),
                dot2(p-0.5*max(p.x+p.y,0.0)))) * sign(p.x-p.y);
}

float lineSeg(in vec2 p, in vec2 a, in vec2 b) {
    vec2 ba = b - a;
    vec2 pa = p - a;
    return length(pa - ba * clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);   
    float tt = fract(0.5 * u_time);
 
    // Scaling and translation
    uv *= 1.2;
    uv += vec2(0.01, 0.60);
    
    // Domain repetition
    float scale = 22.0;
    uv *= scale;
    vec2 cellID = floor(uv);
    vec2 localUV = fract(uv) - 0.5;
     
    vec2 points[9]; 
    float minLine = 1e20;
    float rr = 0.35; // Radius of motion

    // Calculate motion of neighbors
    int count = 0;
    for(float i = 1.0; i >= -1.0; i--) {
        for(float j = -1.0; j <= 1.0; j++) { 
            float offset = TAU * fract(sin(dot(cellID + vec2(j,i), vec2(1.0, 12.0))) * 15745.7342); 
            points[count] = vec2(rr * cos(TAU * tt + offset), rr * sin(TAU * tt + offset));
            count++;        
        }
    }
    
    // Draw the nodes (circles)
    float circ = length(localUV - points[4]) - 0.19;
    if(sdHeart(cellID / scale) < 0.0) {
        col += smoothstep(0.01, -0.01, circ);
    }

    float dVal = 0.0; 
    vec2 thisMotion = points[4];
    
    // Connections between cell nodes
    int count2 = 0;
    for(float i = 1.0; i >= -1.0; i--) {
        for(float j = -1.0; j <= 1.0; j++) {
            if(sdHeart((cellID + vec2(j,i))/scale) < 0.0 && sdHeart(cellID/scale) < 0.0) {
                float currLine = lineSeg(localUV, thisMotion, vec2(j,i) + points[count2]);
                if(currLine < minLine) {
                    minLine = currLine;
                    dVal = distance(thisMotion, vec2(j,i) + points[count2]);
                }
            }
            count2++;
        }
    }
    
    // Diagonal cross-connections
    // Top-Mid to Left-Mid
    if(sdHeart((cellID + vec2(0,1.0))/scale) < 0.0 && sdHeart((cellID + vec2(-1.0,0))/scale) < 0.0) {
        float currLine = lineSeg(localUV, vec2(0,1.0) + points[1], vec2(-1.0,0) + points[3]);
        if(currLine < minLine) { minLine = currLine; dVal = distance(vec2(0,1.0) + points[1], vec2(-1.0,0) + points[3]); }
    }
    // Top-Mid to Right-Mid
    if(sdHeart((cellID + vec2(0,1.0))/scale) < 0.0 && sdHeart((cellID + vec2(1.0,0))/scale) < 0.0) {   
        float currLine = lineSeg(localUV, vec2(0,1.0) + points[1], vec2(1.0,0) + points[5]);
        if(currLine < minLine) { minLine = currLine; dVal = distance(vec2(0,1.0) + points[1], vec2(1.0,0) + points[5]); }
    }
    // Left-Mid to Bottom-Mid
    if(sdHeart((cellID + vec2(-1.0,0))/scale) < 0.0 && sdHeart((cellID + vec2(0,-1.0))/scale) < 0.0) { 
        float currLine = lineSeg(localUV, vec2(-1.0,0) + points[3], vec2(0,-1.0) + points[7]);
        if(currLine < minLine) { minLine = currLine; dVal = distance(vec2(-1.0,0) + points[3], vec2(0,-1.0) + points[7]); }
    }
    // Right-Mid to Bottom-Mid
    if(sdHeart((cellID + vec2(1.0,0))/scale) < 0.0 && sdHeart((cellID + vec2(0,-1.0))/scale) < 0.0) {
        float currLine = lineSeg(localUV, vec2(1.0,0) + points[5], vec2(0,-1.0) + points[7]);
        if(currLine < minLine) { minLine = currLine; dVal = distance(vec2(1.0,0) + points[5], vec2(0,-1.0) + points[7]); }
    }

    // Glow effect
    float dd = 0.3 * (1.2 - clamp(dVal, 1.0, 1.2));
    col += pow(dd / minLine, 4.0); 

    gl_FragColor = vec4(col, 1.0);
}
