precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float PI = 3.14159265359;
float TAU = 6.28318530718;

void main() {
    // Normalized and centered coordinates
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);
    float d = length(uv);
    float a = atan(uv.y, uv.x) + (PI / 2.0) / d;
    float v = sin(TAU * u_time + 8.0 * a); 
    float aa = smoothstep(-0.8, 0.8, v / fwidth(v));
    float mask = smoothstep(0.0, 0.55, d); 
    col = vec3(aa * mask);  
    gl_FragColor = vec4(col, 1.0);
}
