#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

float PI = 3.14159256;
float TAU = 6.28318512;

void main() {
    // Normalized pixel coordinates (from 0 to 1), also centered.
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    vec3 col = vec3(0.0);
     
    // Get distance to center
    float d = length(uv);
    
    // Distance-based rotation (New Version) -- thanks IQ and FN
    // SAFETY FLOOR IMPLEMENTED HERE:
    float a = atan(uv.y, uv.x) + (PI / 2.0) / max(d, 0.01);
    
    // FN Perfect AA Variation
    float v = sin(TAU * u_time + 8.0 * a); 
    col = vec3(smoothstep(-0.8, 0.8, v / fwidth(v)) * smoothstep(0.0, 0.55, d)); 
    
    // Output to screen
    gl_FragColor = vec4(col, 1.0);
}
