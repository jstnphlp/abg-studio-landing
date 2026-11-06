/* ABG Studios — dependency-free WebGL2 ray-marched chrome lettering.
 * The shape texture contains the signed-distance silhouette traced from ABG's supplied logo.
 * We evaluate a real extruded SDF in 3D, compute surface normals, and reflect a synthetic
 * photographic strip-light studio. This is not a CSS gradient or a static logo image.
 */
(() => {
  const selectors = document.querySelectorAll('[data-abg-chrome]');
  if (!selectors.length) return;

  const vertex = `#version 300 es
  in vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

  const fragment = `#version 300 es
  precision highp float;
  uniform sampler2D uShape;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;
  out vec4 outColor;

  const float PI = 3.14159265;
  const float BEVEL = .040;

  mat2 rotate(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  float distance2D(vec2 p) {
    vec2 q = p / vec2(2.09, 1.36) * .5 + .5;
    if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) {
      vec2 edge = max(abs(p)-vec2(2.08, 1.35),0.);
      return length(edge) + .10;
    }
    // Source data is top-left-origin; WebGL texture coordinate starts bottom-left.
    vec2 uv = vec2(q.x, 1.0-q.y);
    return (texture(uShape, uv).r - .50196) * .538;
  }

  // A rounded extrusion with a subtly curved face instead of a flat metallic card.
  float sceneDistance(vec3 p) {
    vec2 r = rotate(-.040) * p.xy;
    float glyph = distance2D(r);
    float core = smoothstep(0.0, .115, -glyph);
    float swell = .095 + .055*core;
    float sculpture = .010*sin(r.x*7.3 + r.y*3.4) * core;
    float zSide = abs(p.z-sculpture) - (swell-BEVEL);
    vec2 w = vec2(glyph+BEVEL, zSide);
    return length(max(w,0.)) + min(max(w.x,w.y),0.)-BEVEL;
  }

  vec3 normalAt(vec3 p) {
    const float e = .006;
    return normalize(vec3(
      sceneDistance(p+vec3(e,0.,0.))-sceneDistance(p-vec3(e,0.,0.)),
      sceneDistance(p+vec3(0.,e,0.))-sceneDistance(p-vec3(0.,e,0.)),
      sceneDistance(p+vec3(0.,0.,e))-sceneDistance(p-vec3(0.,0.,e))
    ));
  }

  float strip(float coordinate, float center, float width, float softness) {
    return 1.0-smoothstep(width, width+softness, abs(coordinate-center));
  }

  vec3 studio(vec3 reflection) {
    vec3 r = normalize(reflection);
    r.xy = rotate(.075*sin(uTime*.17) + uPointer.x*.12) * r.xy;
    float v = .028 + .035 * pow(max(r.y+.4, 0.),2.);
    // Softbox cards and narrow kicker strips produce chrome, not flat shading.
    v += 1.45*strip(r.x + .16*r.y, -.44+.04*sin(uTime*.27), .085,.10);
    v += 1.95*strip(r.x - .10*r.y, .18+.065*sin(uTime*.22), .095,.038);
    v += 1.75*strip(r.x + .07*r.y, .64-.03*cos(uTime*.18), .055,.035);
    v += 1.15*strip(r.y + .20*r.x, .51, .09,.12);
    v += .74 *strip(r.y - .45*r.x, -.54, .045,.085);
    v += .48 *strip(r.x, -.79, .028,.050);
    float darkCard = strip(r.x-.08*r.y,-.10, .095,.035);
    v *= 1.0-.91*darkCard;
    float overhead = max(0.,r.y*.7+r.z*.3+.1);
    v += .14*overhead;
    return vec3(v*.99, v*.998, v*1.025);
  }

  void main() {
    vec2 p = (gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
    vec3 ro = vec3(uPointer.x*.14, uPointer.y*.10,5.45);
    vec3 rd = normalize(vec3(p*1.92, -3.20));
    rd.xy = rotate(uPointer.x*.012) * rd.xy;
    float t = 0.0;
    float distance;
    bool hit = false;
    vec3 point;
    for (int i=0; i<78; i++) {
      point = ro + rd*t;
      distance = sceneDistance(point);
      if(distance < .0036) { hit = true; break; }
      t += max(distance*.83, .013);
      if(t>9.0) break;
    }
    if(!hit) { outColor = vec4(0.); return; }
    vec3 n = normalAt(point);
    vec3 reflection = reflect(rd,n);
    vec3 metal = studio(reflection);
    float facing = max(dot(n, -rd),0.);
    float fresnel = pow(1.-facing,3.8);
    float roughMicro = .015*sin(point.x*30. + point.y*19. + point.z*7.);
    metal = metal*(.81 + fresnel*.45) + vec3(roughMicro);
    metal += vec3(.09)*pow(max(dot(reflection,normalize(vec3(-.3,.6,.7))),0.),28.);
    metal = metal/(vec3(1.)+metal*.28); // gentle photographic highlight rolloff
    metal = pow(max(metal,vec3(0.)),vec3(.91));
    outColor = vec4(metal,1.0);
  }`;

  const getShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to create WebGL shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const details = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(details || 'Shader compilation failed');
    }
    return shader;
  };

  // Euclidean distance transform in linear time (Felzenszwalb/Huttenlocher).
  // Build from the local vector logo so we need neither Blender nor an external CDN.
  function transform1D(f, n, v, z, output) {
    const INF = 1e12;
    let k = 0;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s;
      while (true) {
        const p = v[k];
        s = ((f[q] + q*q) - (f[p] + p*p)) / (2*(q-p));
        if(s > z[k] || k === 0) break;
        k--;
      }
      if(s <= z[k] && k===0) k=0;
      else k++;
      v[k] = q; z[k]=s; z[k+1]=INF;
    }
    k=0;
    for(let q=0;q<n;q++) {
      while(z[k+1]<q) k++;
      output[q]=(q-v[k])*(q-v[k])+f[v[k]];
    }
  }
  function edt(binary,w,h,findForeground) {
    const large=1e10, size=Math.max(w,h);
    const f=new Float32Array(size),tmp=new Float32Array(size),v=new Int32Array(size),z=new Float64Array(size+1);
    const col=new Float32Array(w*h),result=new Float32Array(w*h);
    for(let x=0;x<w;x++) {
      for(let y=0;y<h;y++) f[y]=(binary[y*w+x]===findForeground)?0:large;
      transform1D(f,h,v,z,tmp);
      for(let y=0;y<h;y++) col[y*w+x]=tmp[y];
    }
    for(let y=0;y<h;y++) {
      for(let x=0;x<w;x++) f[x]=col[y*w+x];
      transform1D(f,w,v,z,tmp);
      for(let x=0;x<w;x++) result[y*w+x]=tmp[x];
    }
    return result;
  }
  function imageToDistance(image) {
    const width=500,height=325;
    const offscreen=document.createElement('canvas');
    offscreen.width=width; offscreen.height=height;
    const ctx=offscreen.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw new Error('2D canvas unavailable');
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(image,0,0,width,height);
    const source=ctx.getImageData(0,0,width,height).data;
    const binary=new Uint8Array(width*height);
    for(let i=0;i<binary.length;i++) binary[i]=(source[i*4+3]>120)?1:0;
    const outside=edt(binary,width,height,1),inside=edt(binary,width,height,0);
    const rgba=new Uint8Array(width*height*4);
    for(let i=0;i<binary.length;i++) {
      const sd=Math.sqrt(outside[i])-Math.sqrt(inside[i]);
      const encoded=Math.max(0,Math.min(255,Math.round(128+(sd/32)*127)));
      const at=i*4;
      rgba[at]=rgba[at+1]=rgba[at+2]=encoded;
      rgba[at+3]=255;
    }
    return {rgba,width,height};
  }
  function loadMark() {
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Could not load ABG wordmark'));
      image.src='/brand/abg-logo-fallback.svg';
    });
  }
  async function initialize(canvas) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const gl = canvas.getContext('webgl2', { alpha:true, antialias:true, premultipliedAlpha:false, depth:false, stencil:false, powerPreference:'low-power' });
    if (!gl) return;
    const image=await loadMark();
    const shape=imageToDistance(image);
    const vert = getShader(gl, gl.VERTEX_SHADER, vertex);
    const frag = getShader(gl, gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program,vert);
    gl.attachShader(program,frag);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.deleteShader(vert); gl.deleteShader(frag);
    const tex=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,shape.width,shape.height,0,gl.RGBA,gl.UNSIGNED_BYTE,shape.rgba);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

    const locPosition=gl.getAttribLocation(program,'aPosition');
    const vertices=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locPosition);
    gl.vertexAttribPointer(locPosition,2,gl.FLOAT,false,0,0);
    gl.uniform1i(gl.getUniformLocation(program,'uShape'),0);
    const locSize=gl.getUniformLocation(program,'uResolution');
    const locPointer=gl.getUniformLocation(program,'uPointer');
    const locTime=gl.getUniformLocation(program,'uTime');
    let targetPointer=[0,0], currentPointer=[0,0], visible=true, raf=0, disposed=false;
    let lastFrame=0;
    const adaptSize=()=>{
      const rect=canvas.getBoundingClientRect();
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      // Cap GPU load, especially on laptops and mobile devices.
      const scale=Math.min(1,900/(rect.width*dpr));
      const w=Math.max(1,Math.round(rect.width*dpr*scale));
      const h=Math.max(1,Math.round(rect.height*dpr*scale));
      if(canvas.width!==w || canvas.height!==h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
    };
    const render=(stamp)=>{
      if(disposed)return;
      raf=0;
      if(!visible || document.hidden)return;
      if(!reducedMotion.matches && stamp-lastFrame<30){raf=requestAnimationFrame(render);return;}
      lastFrame=stamp;
      adaptSize();
      currentPointer[0]+=(targetPointer[0]-currentPointer[0])*.065;
      currentPointer[1]+=(targetPointer[1]-currentPointer[1])*.065;
      gl.uniform2f(locSize,canvas.width,canvas.height);
      gl.uniform2f(locPointer,currentPointer[0],currentPointer[1]);
      gl.uniform1f(locTime,reducedMotion.matches?0:stamp*.001);
      gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.classList.add('abg-chrome-ready');
      if(!reducedMotion.matches) raf=requestAnimationFrame(render);
    };
    const start=()=>{if(!raf && visible && !document.hidden)raf=requestAnimationFrame(render);};
    const onMove=(event)=>{
      const bounds=canvas.getBoundingClientRect();
      targetPointer=[Math.max(-1,Math.min(1,((event.clientX-bounds.left)/bounds.width-.5)*2)), Math.max(-1,Math.min(1,(.5-(event.clientY-bounds.top)/bounds.height)*2))];
      if(reducedMotion.matches) start();
    };
    const onLeave=()=>{targetPointer=[0,0];if(reducedMotion.matches)start();};
    const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false; if(visible)start();else cancelAnimationFrame(raf);});
    observer.observe(canvas);
    const resize=new ResizeObserver(()=>{adaptSize();start();});
    resize.observe(canvas);
    const onVisibility=()=>{if(document.hidden)cancelAnimationFrame(raf);else start();};
    const motionChange=()=>start();
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pointermove',onMove,{passive:true});
    window.addEventListener('pointerleave',onLeave);
    reducedMotion.addEventListener('change',motionChange);
    const cleanup=()=>{
      disposed=true;cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();
      document.removeEventListener('visibilitychange',onVisibility);
      window.removeEventListener('pointermove',onMove);
      window.removeEventListener('pointerleave',onLeave);
      reducedMotion.removeEventListener('change',motionChange);
      gl.deleteTexture(tex);gl.deleteBuffer(vertices);gl.deleteProgram(program);
    };
    window.addEventListener('pagehide',cleanup,{once:true});
    start();
  }
  selectors.forEach(canvas=>{initialize(canvas).catch(err=>console.warn('ABG Chrome: using static fallback',err));});
})();
