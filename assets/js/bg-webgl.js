(function(){
  const CANVAS = document.getElementById('bg-webgl');
  if(!CANVAS) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Fallback early if no WebGL
  const gl = CANVAS.getContext('webgl', {antialias:false, depth:false, stencil:false, premultipliedAlpha:true})
         || CANVAS.getContext('experimental-webgl');
  if(!gl){ return; }

  // Resize helper
  function fit(){
    const dpr = Math.min(2, window.devicePixelRatio||1);
    const w = Math.max(1, Math.floor(window.innerWidth*dpr));
    const h = Math.max(1, Math.floor(window.innerHeight*dpr));
    if(CANVAS.width!==w||CANVAS.height!==h){
      CANVAS.width=w; CANVAS.height=h;
      CANVAS.style.width = window.innerWidth+'px';
      CANVAS.style.height = window.innerHeight+'px';
      gl.viewport(0,0,w,h);
    }
  }
  fit();
  window.addEventListener('resize', fit, {passive:true});

  const vertSrc = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main(){ vUv = (aPos+1.0)*0.5; gl_Position = vec4(aPos,0.0,1.0); }
  `;
  const fragSrc = `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uWarp;
  // Paletas (metade esquerda azul, metade direita roxa)
  vec3 colL0 = vec3(0.06, 0.14, 0.19);
  vec3 colL1 = vec3(0.04, 0.10, 0.14);
  vec3 colR0 = vec3(0.16, 0.06, 0.22);
  vec3 colR1 = vec3(0.06, 0.07, 0.09);

  // Bayer 4x4 sem indexação dinâmica (compatível WebGL1)
  float bayer4(vec2 p){
    float x = mod(p.x, 4.0);
    float y = mod(p.y, 4.0);
    if(y < 1.0){
      if(x < 1.0) return 0.0/16.0; if(x < 2.0) return 8.0/16.0; if(x < 3.0) return 2.0/16.0; return 10.0/16.0;
    } else if(y < 2.0){
      if(x < 1.0) return 12.0/16.0; if(x < 2.0) return 4.0/16.0; if(x < 3.0) return 14.0/16.0; return 6.0/16.0;
    } else if(y < 3.0){
      if(x < 1.0) return 3.0/16.0; if(x < 2.0) return 11.0/16.0; if(x < 3.0) return 1.0/16.0; return 9.0/16.0;
    } else {
      if(x < 1.0) return 15.0/16.0; if(x < 2.0) return 7.0/16.0; if(x < 3.0) return 13.0/16.0; return 5.0/16.0;
    }
  }

  void main(){
    vec2 uv = vUv;
    // Leve warp em interação
    uv.x += sin(uv.y*3.1415 + uTime*0.8) * 0.03 * uWarp;
    uv.y += cos(uv.x*3.1415 + uTime*0.6) * 0.02 * uWarp;

    // Mix por eixo X (metade/metade, com feather sutil)
    float edge = smoothstep(0.45, 0.55, uv.x);
    vec3 leftCol = mix(colL0, colL1, smoothstep(0.0,1.0,uv.y));
    vec3 rightCol = mix(colR0, colR1, smoothstep(0.0,1.0,uv.y));
    vec3 base = mix(leftCol, rightCol, edge);

    // Dither Bayer em luminância leve
    float l = dot(base, vec3(0.299,0.587,0.114));
  float d = bayer4(gl_FragCoord.xy);
    l = l + (d - 0.5) * 0.006; // intensidade baixa só para quebrar banding
    vec3 col = base + (d - 0.5) * 0.008;

    gl_FragColor = vec4(col, 1.0);
  }`;

  function compile(type, src){
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
      console.warn('shader error', gl.getShaderInfoLog(sh));
    }
    return sh;
  }
  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uWarp = gl.getUniformLocation(prog, 'uWarp');

  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 1,-1, -1,1, 1,1
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  let t0 = performance.now();
  let anim = 0; // 0 parado, >0 animando
  function draw(time){
    gl.viewport(0,0, CANVAS.width, CANVAS.height);
    gl.uniform2f(uRes, CANVAS.width, CANVAS.height);
    gl.uniform1f(uTime, (time - t0)/1000);
    gl.uniform1f(uWarp, anim);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Render único no load
  draw(performance.now());

  // Micro-animação em interação (scroll/hover) por 2.2s
  if(!reduced){
    let rafId;
    function ping(){
      anim = 1.0;
      const start = performance.now();
      function step(now){
        const dt = (now - start)/2200;
        if(dt >= 1){ anim = 0; draw(now); cancelAnimationFrame(rafId); return; }
        // Ease-out exponencial
        anim = Math.pow(1.0 - dt, 2.0);
        draw(now);
        rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);
    }
    window.addEventListener('mousemove', ping, {passive:true});
    window.addEventListener('scroll', ping, {passive:true});
  }
})();
