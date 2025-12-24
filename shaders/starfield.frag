precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float TAU = 6.28318;

void main() {
    // Standardize UVs
    vec2 uv = ( gl_FragCoord.xy - .5 * u_resolution.xy ) / u_resolution.y;
    vec3 col = vec3(0.);   
    float tt = fract(.3 * u_time);
    
    float scale = 78.;
    vec2 uvStars = uv * scale;
    
    // WebGL 1.0 doesn't have round(), so we use floor(x + 0.5)
    vec2 starCell = floor(uvStars + 0.5);
    uvStars = fract(uvStars - .5) - .5;
    
    float minStar = 1E20;
    
    // Boundary checks
    float xCutoff = .7;
    float yCutOff = xCutoff / (u_resolution.x / u_resolution.y);
    
    // Grid neighbor search (3x3 check)
    float nCheck = 3.;
    for(float i = -3.0; i <= 3.0; i++) {
        for(float j = -3.0; j <= 3.0; j++) {
            
            // Pseudo-random offsets for each star
            vec2 cellOffset = vec2(i, j);
            vec2 id = starCell + cellOffset;
            float r1 = fract(sin(dot(id, vec2(3.0, 12.0))) * 15745.7342) * 2. - 1.;
            float r2 = fract(sin(dot(id, vec2(7.0, 43.0))) * 13131.8234) * 2. - 1.;
            
            float spark = 0.;
            vec2 uvCenter = id / scale;
            
            // Only draw stars within the specific region
            if (abs(uvCenter.x) < xCutoff && abs(uvCenter.y) < yCutOff) {
                vec2 p = uvCenter + vec2(r1 / scale, r2 / scale); 
                float delta = TAU * (tt - 4. * length(p)) + atan(p.y, p.x);
                
                if (r2 > .8) 
                    spark = .3 * sin(TAU * (tt + r1));     
                
                float ssize = r2 * .2;
                float r = 2.;
                
                // Calculate distance to the moving star
                vec2 starPos = cellOffset + 1. * vec2(r1, r2) + vec2(r * cos(delta), r * sin(delta));
                float star = length(uvStars - starPos) - ssize + spark;
                
                minStar = min(minStar, star);
            }
        }
    }
    
    // Anti-aliased rendering
    float w = 54. / u_resolution.y;
    col += smoothstep(w, -w, minStar);
    
    gl_FragColor = vec4(col, 1.0);
}
