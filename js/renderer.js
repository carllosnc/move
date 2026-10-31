// Renderer WebGL — percorre os shaders registrados em window.SHADERS
// e renderiza o ativo em full viewport, com uniforms padrão de tempo e resolução.
(function () {
  const canvas = document.getElementById("canvas");
  const ui = document.getElementById("ui");
  const errorEl = document.getElementById("error");

  const gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) {
    showError("WebGL não é suportado neste navegador.");
    return;
  }

  // necessário para shaders que usam fwidth()
  gl.getExtension("OES_standard_derivatives");

  const shaders = window.SHADERS || [];
  if (shaders.length === 0) {
    showError("Nenhum shader encontrado. Adicione arquivos em shaders/ e inclua-os no index.html.");
    return;
  }

  const vertexSrc = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  // Quad cobrindo a tela inteira (dois triângulos)
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSrc);

  // Compila os fragment shaders e descarta os que falharem
  const compiled = [];
  for (const s of shaders) {
    try {
      compiled.push({ ...s, program: buildProgram(s.fragment) });
    } catch (e) {
      console.error(`Shader "${s.id}" falhou ao compilar:`, e);
    }
  }

  if (compiled.length === 0) {
    showError("Nenhum shader compilou. Veja o console para detalhes.");
    return;
  }

  // UI: um botão por shader (dica de tecla só até a 9ª posição)
  let currentIndex = 0;
  const buttons = compiled.map((s, i) => {
    const btn = document.createElement("button");
    btn.className = "shader-btn";
    btn.innerHTML = `${i < 9 ? `<span class="key">${i + 1}</span>` : ""}${s.name}`;
    btn.addEventListener("click", () => select(i));
    ui.appendChild(btn);
    return btn;
  });

  // Shader inicial: pelo hash da URL (#nebula) ou primeiro da lista
  const fromHash = location.hash.replace("#", "");
  const hashIndex = compiled.findIndex((s) => s.id === fromHash);
  select(hashIndex >= 0 ? hashIndex : 0);

  function select(i) {
    currentIndex = i;
    const s = compiled[i];
    buttons.forEach((b, j) => b.classList.toggle("active", j === i));
    location.hash = s.id;

    gl.useProgram(s.program);

    const posLoc = gl.getAttribLocation(s.program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    s.uTime = gl.getUniformLocation(s.program, "u_time");
    s.uResolution = gl.getUniformLocation(s.program, "u_resolution");
    s.uMouse = gl.getUniformLocation(s.program, "u_mouse");
    s.uMouseIdle = gl.getUniformLocation(s.program, "u_mouseIdle");
    s.uMouseFocus = gl.getUniformLocation(s.program, "u_mouseFocus");
    s.uMouseVel = gl.getUniformLocation(s.program, "u_mouseVel");
  }

  // Mouse: posição normalizada (0..1, y para cima) e tempo ocioso.
  // Os listeners ficam na window para funcionar mesmo com o texto do hero por cima.
  const mouseTarget = { x: 0.5, y: 0.5 };
  const mouse = { x: 0.5, y: 0.5 };
  const mouseVel = { x: 0, y: 0 }; // unidades/s, para efeitos de elasticidade
  let lastMove = -1e9;
  let prevFrame = 0;
  let mouseFocus = 0; // 0..1, já suavizado (contínuo: sem saltos)

  function setMouse(clientX, clientY) {
    mouseTarget.x = clientX / window.innerWidth;
    mouseTarget.y = 1 - clientY / window.innerHeight;
    lastMove = performance.now();
  }
  window.addEventListener("mousemove", (e) => setMouse(e.clientX, e.clientY));
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );

  // Navegação: teclas 1-9, setas e clique para esconder UI temporariamente
  window.addEventListener("keydown", (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= compiled.length) select(n - 1);
    if (e.key === "ArrowRight") select((currentIndex + 1) % compiled.length);
    if (e.key === "ArrowLeft") select((currentIndex - 1 + compiled.length) % compiled.length);
    if (e.key === "h" || e.key === "H") ui.classList.toggle("hidden");
  });

  // Mudança manual na URL (#plasma) também troca o shader
  window.addEventListener("hashchange", () => {
    const i = compiled.findIndex((s) => s.id === location.hash.replace("#", ""));
    if (i >= 0 && i !== currentIndex) select(i);
  });

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener("resize", resize);
  resize();

  // Loop de renderização (respeita prefers-reduced-motion: congela em frame fixo)
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  function frame(now) {
    const time = reduceMotion ? 8.0 : (now - start) / 1000;
    const s = compiled[currentIndex];

    const idle = (now - lastMove) / 1000;
    const dt = Math.min(Math.max((now - prevFrame) / 1000, 0.001), 0.1);
    prevFrame = now;

    // segue o mouse com suavidade; mouseFocus controla a ida/volta ao centro
    const prevX = mouse.x;
    const prevY = mouse.y;
    mouse.x += (mouseTarget.x - mouse.x) * 0.12;
    mouse.y += (mouseTarget.y - mouse.y) * 0.12;

    // Foco do efeito (0..1): 1 enquanto o mouse está ativo, volta a 0 quando
    // ocioso. É um filtro passa-baixo sobre o alvo, então o valor é contínuo —
    // o shader não "pula" nem ao sair do centro nem ao voltar para ele.
    const focusTarget = idle < 0.4 ? 1 : 0;
    const focusRate = focusTarget > mouseFocus ? 3.0 : 0.7;
    mouseFocus += (focusTarget - mouseFocus) * (1 - Math.exp(-focusRate * dt));

    // velocidade do mouse (alimenta o efeito elástico das linhas)
    const rvx = (mouse.x - prevX) / dt;
    const rvy = (mouse.y - prevY) / dt;
    mouseVel.x += (rvx - mouseVel.x) * 0.2;
    mouseVel.y += (rvy - mouseVel.y) * 0.2;
    const speed = Math.hypot(mouseVel.x, mouseVel.y);
    if (speed > 4) {
      mouseVel.x *= 4 / speed;
      mouseVel.y *= 4 / speed;
    }

    gl.useProgram(s.program);
    if (s.uTime) gl.uniform1f(s.uTime, time);
    if (s.uResolution) gl.uniform2f(s.uResolution, canvas.width, canvas.height);
    if (s.uMouse) gl.uniform2f(s.uMouse, mouse.x, mouse.y);
    if (s.uMouseIdle) gl.uniform1f(s.uMouseIdle, idle);
    if (s.uMouseFocus) gl.uniform1f(s.uMouseFocus, mouseFocus);
    if (s.uMouseVel) gl.uniform2f(s.uMouseVel, mouseVel.x, mouseVel.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Helpers ------------------------------------------------------------------

  function buildProgram(fragmentSrc) {
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }

    gl.deleteShader(fragmentShader);
    return program;
  }

  function compile(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src.trim());
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  function showError(msg) {
    errorEl.style.display = "flex";
    errorEl.textContent = msg;
  }
})();
