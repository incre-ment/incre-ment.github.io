
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

const float PI = 3.14159265359;

mat2 rotation(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0);
    float glow = 0.0;
    
    for(float i = 0.0; i < 6.0; i++) {
        float t = fract(u_time * 0.2 + i * 0.15);
        vec3 p = vec3(uv, 0.5);
        p.y += -2.0 + (t * 4.0); // Falling motion
        p.xz *= rotation(u_time + i);
        
        float d = sdTorus(p, vec2(0.3 + i * 0.1, 0.01));
        glow += 0.002 / (d * d);
    }
    
    col = vec3(glow * 0.1, glow * 0.2, glow * 0.3);
    gl_FragColor = vec4(col, 1.0);
}
