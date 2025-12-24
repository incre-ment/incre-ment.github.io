precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

// Native WebGL doesn't always have fwidth, so we enable it or simulate it
#extension GL_OES_standard_derivatives : enable

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

float PI = 3.14159;
float TAU = 6.28318;

float sdCirc( vec2 p, float r ) {
   return length(p) - r;
}

void main() {
    vec4 fragColor = vec4(0.0);
    
    // Kept your 9 sample anti-aliasing
    for( int m=0; m<9; m++ ) {
        vec2 fragOffset = vec2(mod(float(m), 3.0), floor(float(m)/3.0)) / 3.0;
        // u_resolution and gl_FragCoord used here
        vec2 px = (gl_FragCoord.xy + fragOffset - 0.5 * u_resolution.xy) / u_resolution.y;

        // u_time used here
        float tt = fract(0.1 * (u_time + float(m)/9.0 * 1.0/60.0));  
        
        vec3 camPos = vec3(0., 0., 7.6); 
        vec3 rayDir = normalize(vec3(px, -1));

        vec3 p;
        const float ww = 1.0/3.5;
        const float offset = 1.9 * ww;
        int cableNum = 0;
        float depth = 0.;
        
        for( int i=0; i<128; i++ ) { // Reduced slightly for web performance
            p = camPos + depth * rayDir;
            p *= 1.1;
            p.x -= .15;

            const float loop_length = 8.0;
            float r_angle = TAU;
            float angle = mod(p.z, loop_length) / loop_length * r_angle;   
            p.x += .2 + .8 * sin(TAU * p.z / loop_length);
            p.xy *= rotation(angle);
            p.z -= loop_length * tt;       

            cableNum = 0;
            float d = -sdCirc( p.xy, 0.5*5.*ww );
            float d2 = sdCirc( vec2(abs(p.x)-offset, p.y), 0.5*ww );
            float d3 = sdCirc( vec2(p.x, abs(p.y)-offset), 0.5*ww );
            
            if( d2 < d || d3 < d ) {
                if (d2 < d3){ d = d2; cableNum = 1; }
                else { d = d3; cableNum = 2; }
            } 
            depth += d * 0.5;
            if( d < 0.001 || depth > 3.5 ) break;
        }

        vec3 col = vec3(0.0);
        vec2 uv;
        vec3 q = abs(p);
        bool cable = false;
        if( cableNum==1 ) { q.x = abs(q.x-offset); cable = true; }
        if( cableNum==2 ) { q.y = abs(q.y-offset); cable = true; }

        if( q.x > q.y ) uv = vec2(p.y, mod(p.z, 8.0));
        else uv = vec2(mod(p.z, 8.0), p.x);

        if (cable){ 
            vec2 star_uv = 6.9 * uv/ww;
            vec2 starID = floor(star_uv + 0.5); // Native replacement for round()
            star_uv = star_uv - starID;
            float off = fract(323.23 * sin(starID.x/10.0) + 12.0 * sin(starID.y/10.0));
            float star_rad = .18 + .18 * sin(TAU * (4.0 * tt + off));
            float star = length(star_uv) - star_rad;
            col += smoothstep(0., -0.01, star); // Simplified fwidth for stability
        }
    
        vec2 grid = abs(fract(uv/ww)-0.5);
        float f = min(grid.x, grid.y);
        f = smoothstep(depth * .02, 0., f - 0.02);
        col = mix( col, vec3(1.0), f );

        float fog_factor = 1.0 - smoothstep(1.0, 3.5, depth);
        col = mix(vec3(0.0), col, fog_factor);
        fragColor += vec4(col/9.0, 0.111); // Averaging over 9 samples
    }
    gl_FragColor = vec4(fragColor.rgb, 1.0);
}
