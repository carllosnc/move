// Topografia — curvas de nível de um relevo que muda devagar.
// Linhas finas sobre fundo escuro (texto do hero fica legível) e o cursor
// ilumina o mapa por onde passa.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "topografia",
  name: "Topografia",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;      // 0..1, y para cima, com suavização
uniform float u_mouseFocus; // 0..1, já suavizado pelo renderer (contínuo)

// Ruído de valor 2D
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm4(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rot * p * 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float fbm2(vec2 p) {
  float value = 0.0;
  float amplitude = 0.6;

  for (int i = 0; i < 2; i++) {
    value += amplitude * noise(p);
    p = p * 2.1;
    amplitude *= 0.5;
  }
  return value;
}

// Altura do relevo: duas camadas em deriva lenta e em sentidos opostos,
// então o padrão evolui de verdade (não só desliza pela tela).
float height(vec2 uv, float t) {
  float h = fbm4(uv * 1.7 + vec2(t * 0.5, -t * 0.31));
  h += 0.30 * fbm2(uv * 3.8 - vec2(t * 0.21, t * 0.47));
  return h * 0.74; // normaliza para ~0..0.9
}

void main() {
  // espaço centralizado: 1 unidade = altura da tela (células estáveis)
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float px = 1.0 / min(u_resolution.x, u_resolution.y); // 1 pixel em uv
  float t = u_time * 0.05; // movimento lento, adequado para fundo de hero

  // altura + gradiente por amostragem (3 evaluations) → espessura uniforme
  // das curvas de nível, sem depender de extensões/fwidth
  float e = 0.0035;
  float h = height(uv, t);
  float hx = height(uv + vec2(e, 0.0), t);
  float hy = height(uv + vec2(0.0, e), t);
  float g = clamp(length(vec2(hx - h, hy - h)) / e, 0.001, 2.0);

  float levels = 8.0;
  float v = h * levels;

  // distância (em uv) até a curva de nível mais próxima
  float dMin = abs(fract(v + 0.5) - 0.5) / (levels * g);
  // a cada 4ª curva, uma linha principal mais grossa (índice do mapa)
  float dMaj = abs(fract(v * 0.25 + 0.5) - 0.5) * 4.0 / (levels * g);

  float minor = 1.0 - smoothstep(0.0, px * 1.1, dMin);
  float major = 1.0 - smoothstep(0.0, px * 2.0, dMaj);

  // luz do cursor sobre o mapa
  vec2 mp = (u_mouse - 0.5) * 2.0 * u_resolution.xy / min(u_resolution.x, u_resolution.y);
  float dm = length(uv - mp);
  float glow = exp(-dm * dm * 5.0) * u_mouseFocus;

  // fundo: quase preto-azulado, um pouco mais claro no centro
  vec3 color = mix(vec3(0.016, 0.020, 0.045), vec3(0.032, 0.040, 0.078),
                   exp(-dot(uv, uv) * 1.1));

  // sombreado suave de altitude (relevo mais alto um pouco mais claro)
  color += vec3(0.020, 0.045, 0.065) * smoothstep(0.35, 0.9, h);

  // curvas de nível
  vec3 lineCol = vec3(0.35, 0.62, 0.78);
  color += lineCol * minor * (0.15 + glow * 0.55) * (0.5 + 0.5 * h);
  color += vec3(0.55, 0.80, 0.95) * major * (0.10 + glow * 0.45);

  // halo frio onde o cursor passa
  color += vec3(0.06, 0.10, 0.20) * glow * 0.55;

  // vinheta + dither (evita banding no degradê escuro)
  color *= 1.0 - 0.40 * smoothstep(0.50, 1.35, length(uv * vec2(1.0, 1.35)));
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`,
});
