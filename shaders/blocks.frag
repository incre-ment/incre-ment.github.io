precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

const float PI = 3.14159;
const float TAU = 6.28318;

// Explicit rotation function for WebGL compatibility
mat2 rotation(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

void main()
{
    vec2 uv = ( gl_FragCoord.xy - .5 * u_resolution.xy ) / u_resolution.y;
    vec3 col = vec3(0.);   
    float tt = fract(.5 * u_time);
   
    // Rotate the whole scene
    uv *= rotation(PI/4.);
   
    // --- Stars Layer ---
    vec2 uvStars = uv * 30.;
    vec2 starCell = floor(uvStars);
    vec2 starUV = fract(uvStars) * 2. - 1.;
    
    float r1 = fract(sin(dot(starCell, vec2(1.0, 12.0))) * 15745.7342) * 2. - 1.;
    float r2 = fract(sin(dot(starCell, vec2(1.0, 43.0))) * 13131.8234) * 2. - 1.;
    
    float spark = 0.;
    if (r2 > .3) spark = .1 * sin(TAU * (tt + r1));     
    float ssize = r2 * .2;  
    float star = length(starUV - .7 * vec2(r1, r2)) - ssize + spark;
    col += smoothstep(.1, -.1, star);
   
    // --- Blocks Grid Layer ---
    float scale = 9.;
    uv *= scale;
   
    float cellID = floor(uv.x);
    uv.x = fract(uv.x) * 2. - 1.0;
   
    // Calculate blocks stacked on each side
    float numTop = floor(4. * fract(sin(5.232 + 3.3 * cellID * .3)) + 1.75);
    float numBot = floor(4. * fract(sin(8.12 + 8.8 * cellID * .3)) + 1.75);
   
    float w = 2. / u_resolution.y;
 
    // Top / Transfer blocks
    vec2 motionTop = vec2(0., tt);
    for(float i = -5.; i < 10.; i++){
        if(i >= numTop) break; // Optimization for WebGL loops
        
        if (i == (numTop - 1.)){
            motionTop = vec2(0., tt * ((scale + 2.) - (numTop + numBot)));
        }
     
        vec2 boxOffset = vec2(0., (scale/2.0) - i);
        float box = sdBox(uv - boxOffset + motionTop, vec2(.85, .85/2.0));
        col += smoothstep(w, -w, box);
    }
   
    // Bottom stacked blocks
    vec2 motionBot = vec2(0., tt);
    for(float i = -5.; i < 10.; i++){
        if(i >= numBot) break;
        
        vec2 boxOffset = vec2(0., -(scale/2.0) + i);
        float box = sdBox(uv - boxOffset + motionBot, vec2(.85, .85/2.0));
        col += smoothstep(w, -w, box);
    }
 
    gl_FragColor = vec4(col, 1.0);
}
