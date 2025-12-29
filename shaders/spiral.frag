precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    // 1. Basic UV setup
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // 2. Distance with a larger safety floor
    float d = length(uv);
    
    // 3. Simplified Polar Angle
    // Using atan(uv.y, uv.x) but adding a tiny epsilon to uv.x to prevent 0,0 errors
    float angle = atan(uv.y, uv.x + 1e-9);
    
    // 4. The Spiral Math
    // We cap the "twist" (1.0/d) so it doesn't hit infinity at the center
    float twist = 1.5707 / max(d, 0.01);
    float spiral = sin(6.2831 * u_time + 8.0 * angle + twist);
    
    // 5. Explicit Masking
    // If d is very small, we just force it to black to avoid the "infinity" zone
    float mask = smoothstep(0.0, 0.45, d);
    if(d < 0.01) mask = 0.0; 

    // 6. Simple threshold
    float colorVal = spiral > 0.0 ? 1.0 : 0.0;
    
    gl_FragColor = vec4(vec3(colorVal * mask), 1.0);
}
