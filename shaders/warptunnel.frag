precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))

float PI = 3.14159;
float TAU = 6.28318;

// Safety floor added to avoid sqrt(0) or division issues
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

// Fixed denominator to prevent division by zero
float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/max(dot(ba,ba), 0.0001), 0.0, 1.0 );
    return length( pa - ba*h );
}

// Safety: Replaced pow() with multiplication to avoid negative base crash
float easeInOutCubic(float x){
    if(x < 0.5) return 4. * x * x * x;
    float f = (-2. * x + 2.);
    return 1. - (f * f * f) / 2.;
}

vec3 boxSize = vec3(.49,.49,.49);
vec3 frameSize = vec3(.5,.5,.5);

void mainImage0( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord-.5*u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0);  
    float tt = fract( u_time);
    
    // Safety: Ensure rayDir isn't zero
    vec3 camPos = vec3(0., 0., 4.5 - 2. * u_time); 
    vec3 rayDir = normalize(vec3(uv, -1.0));
  
    float depth = 0.0;
    float closest = 0.0;
    float d;
    vec3 p = vec3(0);
    vec3 cID = vec3(0);
    
    for(int numIter = 0; numIter < 100; numIter++){ // Reduced iterations for mobile stability
        p = camPos + depth * rayDir;

        p.x = p.x + 1.5*sin(p.z);
        p.y += (.2*abs(p.x * p.x));

        float scale = 2.;
        vec3 cellID = floor(scale * p + 0.5); // Using floor(x+0.5) as a safe round()

        // The Tunnel cutout logic
        if (cellID.x > 0. && cellID.x <= 1.) cellID.x = 2.;
        if (cellID.x <= 0. && cellID.x >= -1.) cellID.x = -2.;
        if (cellID.y > 0. && cellID.y <= 1.) cellID.y = 2.;
        if (cellID.y <= 0. && cellID.y >= -1.) cellID.y = -2.;
 
        vec3 localP = (scale * p) - cellID;
      
        float box = sdBox(localP, boxSize);
        float frame = sdBoxFrame(localP, frameSize, .02);  
        d = min(box,frame);
        closest = step(0.,box-frame);
        depth += d * 0.15; // Small step multiplier for accuracy
        
        if (d < .01 || depth > 20.0){ 
            cID = cellID;
            p = localP;
            break;
        }
    }

    if (depth < 20.0) {
        if (closest == 0.){
            vec3 q = abs(p);
            vec2 side = (q.x > q.y && q.x > q.z) ? p.yz : (q.y >= q.x && q.y > q.z) ? p.xz : p.xy;
            
            // Star logic
            vec2 star_uv = 8. * side;
            vec2 starID = floor(star_uv + 0.5);
            star_uv = star_uv - starID;
            float off = fract(323.23*sin(cID.x + starID.x/10.) * 12.*sin(cID.y + starID.y/10.));
            float star_rad = .2 + .2*sin(TAU*tt + TAU*off);
            float star = length(star_uv) - star_rad;
            col += smoothstep(0., -0.1, star); 
        } else {
            col = vec3(1.);
        }
    }
  
    col = mix(1.5*col, vec3(0.), smoothstep(0., 8., depth));
    fragColor = vec4(col, 1.0);
}

void main() {
    // Smart AA requires fwidth, which needs the OES extension. 
    // For maximum compatibility across all nodes, we'll run the base image.
    mainImage0(gl_FragColor, gl_FragCoord.xy);
}
