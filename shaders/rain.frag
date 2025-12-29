precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

// Ellipse SDF by IQ
float sdEllipse( in vec2 p, in vec2 ab )
{
    p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
    float l = ab.y*ab.y - ab.x*ab.x;
    float m = ab.x*p.x/l;      float m2 = m*m; 
    float n = ab.y*p.y/l;      float n2 = n*n; 
    float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
    float q = c3 + m2*n2*2.0;
    float d = c3 + m2*n2;
    float g = m + m*n2;
    float co;
    if( d<0.0 )
    {
        float h = acos(q/c3)/3.0;
        float s = cos(h);
        float t = sin(h)*sqrt(3.0);
        float rx = sqrt( -c*(s + t + 2.0) + m2 );
        float ry = sqrt( -c*(s - t + 2.0) + m2 );
        co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
    }
    else
    {
        float h = 2.0*m*n*sqrt( d );
        float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
        float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
        float rx = -s - u - c*4.0 + 2.0*m2;
        float ry = (s - u)*sqrt(3.0);
        float rm = sqrt( rx*rx + ry*ry );
        co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
    }
    vec2 r = ab * vec2(co, sqrt(1.0-co*co));
    return length(r-p) * sign(p.y-r.y);
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main()
{
    vec2 uv = ( gl_FragCoord.xy - .5 * u_resolution.xy ) / u_resolution.y;
    vec3 col = vec3(0.);   
    float t = fract(u_time);

    for(float numLayers = 0.; numLayers < 10.; numLayers++){ 

        float scale = 10. + numLayers;
        vec2 uv_layer = uv;    
        uv_layer *= scale;
                
        float cellIDx = floor(uv_layer.x);
        uv_layer.x = fract(uv_layer.x) - .5;
   
        float cellOff = fract(324.6*sin(46.7*cellIDx + numLayers));
        float n_cellOff = fract(324.6*sin(46.7*(cellIDx+1.) + numLayers));
     
        float xVal = 1.0 - 1.0*fract(t + cellOff);
        float n_xVal = 1.0 - 1.0*fract(t + n_cellOff);
     
        float rainfallCutOff = -4.; 
        float fallHeight = (2.5 * scale/2.);
        float rainDelta = fallHeight - rainfallCutOff;
     
        float yVal =  fallHeight - rainDelta*fract(t + cellOff);
        float n_yVal =  fallHeight - rainDelta*fract(t + n_cellOff);
   
        float drop1 = sdEllipse(uv_layer - vec2(n_xVal, n_yVal), vec2(.03,.15));
        float drop2 = sdEllipse((uv_layer - vec2(xVal, yVal) - vec2(-1.0,0.0)), vec2(.03,.15));
    
        float drop = min(drop1,drop2);

        float w = 10./u_resolution.y;
        col += smoothstep(w,-w,drop);

        if (n_yVal < rainfallCutOff + 3.5){
            float dropDelta = map((rainfallCutOff + 3.5) - n_yVal, 0., 3.5, 0., 1.);     
            float ell = abs(sdEllipse(uv_layer - vec2(0., rainfallCutOff), vec2(.45*dropDelta,.2*dropDelta))) - .03;
            w = 20./u_resolution.y;
            col += smoothstep(w,-w,ell);
        }
    }
    
    gl_FragColor = vec4(col,1.0);
}
