precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float PI = 3.14159265359;
float TAU = 6.28318530718;

void main() {
    // Normalized and centered coordinates
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    float d = length(uv);
    
    // Safety check to avoid division by zero at the very center
    float a = atan(uv.y, uv.x) + (PI / 2.0) / max(d, 0.001);
    
    float v = sin(TAU * u_time + 8.0 * a); 
    
    // Manual Anti-Aliasing instead of fwidth
    // We use a small fixed value (0.1) to soften the edges
    float aa = smoothstep(-0.1, 0.1, v);
    
    // Mask to fade the spiral out as it moves away from center
    float mask = smoothstep(0.0, 0.55, d); 
    
    vec3 col = vec3(aa * mask);  
    
    gl_FragColor = vec4(col, 1.0);
}
