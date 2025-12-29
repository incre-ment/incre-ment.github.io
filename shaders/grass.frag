precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))
float TAU = 6.28318530718;

void main() {
    // Standardize coordinates
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);
    float tt = fract(0.3 * u_time);
    
    // Slight tilt to the whole scene
    uv *= rotation(TAU / 20.0);

    // --- Draw Stars (Cellular Noise) ---
    vec2 uvStars = uv * 30.0;
    vec2 starCell = floor(uvStars);
    vec2 uvStarsFract = fract(uvStars) - 0.5;   
    float minStar = 1e20;
    
    for(float i=-1.0; i<=1.0; i++) {
        for(float j=-1.0; j<=1.0; j++) {
            // Pseudo-random star positions within cells
            float r1 = fract(sin(dot(starCell + vec2(i,j), vec2(3.0, 12.0))) * 15745.7342) * 2.0 - 1.0;
            float r2 = fract(sin(dot(starCell + vec2(i,j), vec2(7.0, 43.0))) * 13131.8234) * 2.0 - 1.0;
            
            float spark = 0.0;
            if (r2 > 0.3) spark = 0.1 * sin(TAU * (tt + r1));     
            
            float ssize = r2 * 0.1;  
            float star = length((uvStarsFract - vec2(i,j)) - vec2(r1, r2)) - ssize + spark;
            minStar = min(minStar, star);
        }
    }
    float w = 54.0 / u_resolution.y;
    col += smoothstep(w, -w, minStar);

    // --- Draw Moon ---
    float m = length(uv - vec2(0.5, 0.44)) - 0.2;
    w = 1.0 / u_resolution.y;
    col += smoothstep(w, -w, m);

    // --- Draw Grass (Layered Parallax) ---
    for (float j = 1.0; j <= 4.0; j++) { 
        float scale = 6.0 + 2.0 * j;
        vec2 uv_layer = uv * scale;
        float cellID = floor(uv_layer.x);
        float localX = fract(uv_layer.x) - 0.5;
        float minVal = 1e20;
        
        for (float i = -1.0; i <= 1.0; i++) {
            // Randomize height and offset for each blade
            float off = TAU * fract(7.67 * sin(5.2 * (cellID + i + 3.4 * j)));  
            float h = 0.5 * off / TAU; 
            
            // Blade width gets thinner as it goes up
            float width = (-uv.y + h - 0.2) * 0.25;
            float swayAmount = (uv.y + 0.5);
            
            // The Sway (Sin wave movement)
            float sway = sin(TAU * tt - 3.0 * uv.y + off) * swayAmount;
            float curve = -0.3 + 0.6 * off / TAU;
            
            float v = abs(localX - i - sway - curve) - width;
            minVal = min(v, minVal);
        }  
        // Distant layers are dimmer (/j)
        col += smoothstep(w, -w, minVal) / j;
    }

    gl_FragColor = vec4(col, 1.0);
}
