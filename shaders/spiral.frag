precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float d = length(uv);
    
    // Only fix the division by zero. If this works, the others weren't the problem.
    float a = atan(uv.y, uv.x) + (PI / 2.0) / max(d, 0.01); 
    
    float v = sin(6.28 * u_time + 8.0 * a);
    gl_FragColor = vec4(vec3(v), 1.0);
}
