precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

#define rotation(angle) mat2(cos(angle), -sin(angle), sin(angle), cos(angle))
float TAU = 2.*3.14159;

float eqTri( in vec2 p, in float r ) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    return -length(p)*sign(p.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
    vec3 col = vec3(0.);
    float t = fract(.1 * u_time);
    uv *= rotation(3. * TAU * (.3 - clamp(length(uv),0.,.3)));
    float s = -1.;
    for(float i = 0.; i < 3.; i++){
        float rad = .4 / pow(2.,i) * (.9 - .2 * i);
        uv *= rotation(-2. * s * (i + 1.) * TAU * t);
        float tri = eqTri(uv, rad);
        s *= -1.;
        col += .004 / abs(tri);
    }
    gl_FragColor = vec4(col, 1.0);
}
