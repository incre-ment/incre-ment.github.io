precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

// Helper for rotation
mat2 rotation(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float PI = 3.14159265;
float TAU = 6.28318530;

// line SDF learned from IQ.
float lineSeg(in vec2 p, in vec2 pointA, in vec2 pointB) {
    vec2 ba = pointB - pointA;
    vec2 pa = p - pointA;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - h * ba);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);
    
    // Smooth looping time
    float tt = fract(0.2 * u_time);
    
    float numPts = 5.0;

    for (float i = 0.0; i < 5.0; i++) {
        float offset = TAU * (tt + i / numPts);
        
        // Rotate uv space
        mat2 rot = rotation(i * TAU / numPts);
        mat2 invRot = rotation(-i * TAU / numPts);
        
        uv *= rot;
        
        float ls = lineSeg(uv, vec2(0.0, 0.35 * sin(offset)), vec2(0.0, -0.35)) - 0.055;
        float cc = length(uv - vec2(0.0, 0.35 * sin(offset))) - 0.055;
        float ls2 = lineSeg(uv, vec2(0.0, 0.35 * sin(offset)), vec2(0.0, -0.35));   
        
        // Rotate back
        uv *= invRot;
        
        // Glow effects
        col += 0.0018 / abs(ls);
        col += 0.001 / ls2;
        
        float w = 2.0 / u_resolution.y;
        col += smoothstep(w, -w, cc);
    }
    
    gl_FragColor = vec4(col, 1.0);
}
