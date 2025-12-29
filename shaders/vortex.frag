precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

const float PI = 3.14159265359;

// Helper: Rotation matrix
mat2 rotation(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// Helper: Map function (standard in GLSL but often needs manual definition)
float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float circleSDF(vec2 coords, float rad, vec2 offset){
    return (length(coords-offset) - rad);
}

float circleSDF2(vec2 coords, float rad, vec2 offset){
    return abs(length(coords-offset) - rad)-.001;
}

void main() {
    // Standardize coordinates for your engine
    vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
    
    // --- The Vortex Logic ---
    
    // Translate, rotate, translate back (Left Vortex)
    uv += vec2(-0.4, 0.0); 
    uv *= rotation(PI/2. * pow((1.42 - pow(length(uv), .5)), 15.));
    uv += vec2(0.4, 0.0);
    
    // Translate, rotate, translate back (Right Vortex)
    uv += vec2(0.4, 0.0);
    uv *= rotation(PI/2. * pow((1.42 - pow(length(uv), .5)), 15.)); 
    uv += vec2(-0.4, 0.0);
    
    // Determine which vortex the point is closer to
    float d = pow(min(distance(uv, vec2(-0.4, 0.)), distance(uv, vec2(0.4, 0.))), 1.5); 

    // Motion and repetition
    float modVal = 0.1;
    uv += vec2(-u_time * modVal, 0.);
    uv = mod(uv, modVal);
     
    vec3 col = vec3(0.);
     
    // Map distance to a scale value
    float dd = map(d, 0., 1.25, .015, 0.);  
    
    // Draw the circles
    float cSDF = circleSDF(uv, .035 - pow(dd, 1.20), vec2(modVal/2.0, modVal/2.0));
    col += 3.5 * d * smoothstep(.006, -.006, cSDF);  
     
    float cSDF2 = circleSDF2(uv, .06 - pow(dd, 1.20), vec2(modVal/2.0, modVal/2.0));
    col += 3.5 * d * smoothstep(.006, -.006, cSDF2); 
    
    gl_FragColor = vec4(col, 1.0);
}
