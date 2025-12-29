precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

float PI = 3.14159;
float TAU = 6.28318;

// Thanks IQ for the SDF functions!
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

vec3 boxSize = vec3(.49,.49,.49);
vec3 frameSize = vec3(.5,.5,.5);

void mainImage0( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord-.5*u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0);  
    float tt = fract(u_time);
    
    vec3 camPos = vec3(0., 0., 3.5); 
    vec3 rayDir = normalize(vec3(uv, -1));
    
    float d, depth = 0.0;
    float closest = 0.0;
    vec3 p = vec3(0);
    vec3 cID = vec3(0);

    for(int numIter = 0; numIter < 64; numIter++){ // Reduced iterations slightly for performance
        p = camPos + depth * rayDir;

        p.xy *= rotation(u_time + p.z);
        p.xz *= rotation(u_time);

        // Limited Domain Repetition    
        float scale = 2.;
        vec3 cellID = clamp(round(scale * p),-1.,1.0);
        p = (scale * p) - cellID;
          
        // SDFs
        float box = sdBox(p, boxSize);
        float frame = sdBoxFrame(p, frameSize, .02);  
        float dist = min(box,frame);
        closest = step(0.,box-frame);
        depth += dist * .3;
        if (dist < .01 || depth > 8.0){ 
            cID = cellID;
            break;
        }
    }
    
    d = depth;

    if (d > 8.) {
        col = vec3(0.);  
    } 
    else if (closest == 0.){
        vec2 side;
        vec3 q = abs(p);
        if (q.x > q.y && q.x > q.z){ side = p.yz; } 
        else if (q.y >= q.x && q.y > q.z){ side = p.xz; }
        else { side = p.xy; };    

        // Draw Stars (on boxes)
        vec2 star_uv = 8. * side;
        vec2 starID = round(star_uv);
        star_uv = star_uv - starID;
        float off = fract(323.23*sin(cID.x + starID.x/10.) * 12.*sin(cID.y + starID.y/10.));
        float star_rad = .2 + .2*sin(TAU*tt + TAU*off);
        float star = length(star_uv) - star_rad;
        col += smoothstep(0.,-0.05,star);
    } 
    else {
        col = vec3(1.);
    }
    
    fragColor = vec4(col, 1.0);
}

void main() {
    // Standard invocation for your engine
    mainImage0(gl_FragColor, gl_FragCoord.xy);
}
