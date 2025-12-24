precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define RSEED 92.
float TAU = 6.283185;

float sdBox(in vec2 p, in vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.0);
    float tt = 0.3 * u_time;
    float w = 1.0 / u_resolution.y;

    // Draw Moon
    float moon = length(uv - vec2(0.37, 0.25)) - 0.2;
    col += smoothstep(w, -w, moon);

    // Draw Buildings
    vec2 uv_b = uv;
    float minVal;
    float inB = 0.0;
    
    for(float j = 0.0; j <= 2.0; j++){
        float scale = 6.5 + 2.0 * j;
        uv_b = uv * scale;
        uv_b.x += (1.5 * j + 1.0) * tt;
        float buildingID = floor(uv_b.x);
        uv_b.x = fract(uv_b.x) - 0.5;   
        float off = fract(RSEED * sin((j + 10.0) * 1.2 * (buildingID + 10.0) + 1.0));
        minVal = 1e20;

        for(float i = -1.0; i <= 1.0; i++){
            float off2 = fract(RSEED * sin((j + 10.0) * 1.2 * (buildingID + 10.0 + i) + 1.0));
            float b_width = 0.25 + 0.5 * off2; 
            float h = floor(1.6 * off2 + 0.5) + 0.25 * floor(4.0 * off2);
            float y = -(scale / 2.0) + h;
            float xDel = 0.3 * off2;
            float b = sdBox((uv_b - vec2(xDel, y)) - vec2(i, 0.0), vec2(b_width, h));
            minVal = min(minVal, b);
        }
    
        inB += step(minVal, 0.0) * step(inB, 0.0);
        col *= step(0.0, minVal);
        col += step(0.0, minVal) * step(minVal, 0.07);

        float hh = floor(1.6 * off + 0.5) + 0.25 * floor(4.0 * off);
        vec2 new_uv_b = (uv_b - vec2(0.3 * off, -scale / 2.0 + hh));
        
        // Windows
        float winScale = 4.0;
        vec2 win_uv = new_uv_b * winScale;
        vec2 winID = floor(win_uv);
        win_uv = fract(win_uv) - 0.5;
        float offwin = fract(58.0 * sin((j + 10.0) * 1.2 * (buildingID + 20.0) + 1.0));
        
        if (winID.x == -1.0 || winID.x == 0.0) {
            if (winID.y < 4.0 * hh) {
                float ranOff = fract(1212.3 * sin(12.0 * winID.x + 50.0 + buildingID) * 212.0 * cos(98.6 * winID.y + 50.0));
                if(ranOff < 0.80) {     
                    float c = sdBox(win_uv, vec2(0.2 + 0.2 * off, (0.35 * offwin) + 0.05));
                    col += smoothstep(w, -w, c);
                } 
            }
        }
    }
    
    // Stars
    vec2 uvStars = uv * 30.0;
    vec2 starCell = floor(uvStars);
    uvStars = fract(uvStars) - 0.5;   
    float minStar = 1e20;
    for(float i = -1.0; i <= 1.0; i++) {
        for(float j = -1.0; j <= 1.0; j++) {
            float r1 = fract(sin(dot(starCell + vec2(i, j), vec2(3.0, 12.0))) * 15745.7342) * 2.0 - 1.0;
            float r2 = fract(sin(dot(starCell + vec2(i, j), vec2(7.0, 43.0))) * 13131.8234) * 2.0 - 1.0;
            float spark = 0.0;
            if (r2 > 0.3) spark = 0.1 * sin(TAU * (tt + r1));     
            float ssize = r2 * 0.1;  
            float star = length((uvStars - vec2(i, j)) - 1.0 * vec2(r1, r2)) - ssize + spark;
            minStar = min(minStar, star);
        }
    }
    w = 54.0 / u_resolution.y; 
    col += smoothstep(w, -w, minStar) * (1.0 - inB);
    
    gl_FragColor = vec4(col, 1.0);
}
