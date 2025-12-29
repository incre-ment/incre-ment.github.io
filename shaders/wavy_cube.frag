#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

float PI = 3.14159;
float TAU = 6.28318;

// SDFs with safety checks
float sdBoxFrame( vec3 p, vec3 b, float e ) {
    p = abs(p)-b;
    vec3 q = abs(p+e)-e;
    return min(min(
        length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
        length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
        length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

float sdBox( vec3 p, vec3 b ) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
    vec2 pa = p-a, ba = b-a;
    // Safety floor for segment division
    float h = clamp( dot(pa,ba)/max(dot(ba,ba), 0.0001), 0.0, 1.0 );
    return length( pa - ba*h );
}

float easeInOutCubic(float x){
    if(x < 0.5) return 4. * x * x * x;
    // Manual multiplication to avoid pow() negative base crash
    float f = (-2. * x + 2.);
    return 1. - (f * f * f) / 2.;
}

vec3 boxSize = vec3(.49,.49,.49);
vec3 frameSize = vec3(.5,.5,.5);

void mainImage0( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord-.5*u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0);  
    float tt = fract(u_time);
    
    vec3 camPos = vec3(0., 0., 3.5); 
    vec3 rayDir = normalize(vec3(uv, -1.0));
  
    float depth = 0.0;
    float closest = 0.0;
    vec3 p = vec3(0);
    vec3 cID = vec3(0);
    float dist; // Renamed to avoid shadowing 'd'

    for(int numIter = 0; numIter < 80; numIter++){
        p = camPos + depth * rayDir;

        // The "Wavy" part
        p.xy *= rotation(u_time + p.z);
        p.xz *= rotation(u_time);

        float scale = 2.;
        // round() replacement for WebGL 1.0
        vec3 cellID = clamp(floor(scale * p + 0.5), -1., 1.0);
        vec3 lp = (scale * p) - cellID;
          
        float box = sdBox(lp, boxSize);
        float frame = sdBoxFrame(lp, frameSize, .02);  
        dist = min(box,frame);
        closest = step(0.,box-frame);
        
        depth += dist * 0.3;
        if (dist < .01 || depth > 10.0){ 
            cID = cellID;
            p = lp; // Pass local p out for texturing
            break;
        }
    }

    if (depth < 10.0) {
        vec3 q = abs(p);
        vec2 side = (q.x > q.y && q.x > q.z) ? p.yz : (q.y >= q.x && q.y > q.z) ? p.xz : p.xy;

        // Draw Stars
        vec2 star_uv = 8. * side;
        vec2 starID = floor(star_uv + 0.5);
        star_uv = star_uv - starID;
        float off = fract(323.23*sin(cID.x + starID.x/10.) * 12.*sin(cID.y + starID.y/10.));
        float star_rad = .2 + .2*sin(TAU*tt + TAU*off);
        float star = length(star_uv) - star_rad;
        
        // Safety: fwidth check for the stars
        float fw = 0.05;
        #ifdef GL_OES_standard_derivatives
            fw = fwidth(star);
        #endif
        
        float starPattern = smoothstep(0., -fw, star);
        
        if (closest == 0.0) col = vec3(starPattern);
        else col = vec3(1.0);
    }
  
    fragColor = vec4(col, 1.0);
}

void main() {
    // Smart AA also needs fwidth. If not available, just run mainImage0
    #ifdef GL_OES_standard_derivatives
        vec4 O;
        mainImage0(O, gl_FragCoord.xy);
        if ( fwidth(length(O)) > .01 ) {
            vec4 o;
            for (int k=0; k < 9; k++ ) {
                if(k==4) continue; // Skip center as we have it in O
                mainImage0(o, gl_FragCoord.xy + vec2(mod(float(k),3.0)-1.0, floor(float(k)/3.0)-1.0)/3.0); 
                O += o;
            }
            O /= 9.0;
        }
        gl_FragColor = O;
    #else
        mainImage0(gl_FragColor, gl_FragCoord.xy);
    #endif
}
