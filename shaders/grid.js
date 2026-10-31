// Grid — grade minimalista de linhas finas para hero section.
// Mouse: luz suave e elevação suave das linhas quando o cursor passa.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "grid",
  name: "Grid",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;      // 0..1, y para cima, com suavização
uniform float u_mouseFocus; // 0..1, já suavizado pelo renderer (contínuo)

void main() {
  float aspect = u_resolution.x / u_resolution.y;

  // espaço normalizado: y em 0..1 (células quadradas em qualquer tela)
  vec2 uv = gl_FragCoord.xy / u_resolution.y;
  vec2 center = vec2(aspect * 0.5, 0.5);

  // mouse; sai do centro e volta para ele sem saltos (u_mouseFocus é um
  // filtro passa-baixo no renderer, então a mistura é sempre contínua)
  vec2 m = mix(center, u_mouse * vec2(aspect, 1.0), u_mouseFocus);

  // elevação: as linhas cedem suavemente ao redor do cursor quando ele passa
  // (deslocamento radial com módulo → 0 no centro: sem singularidade/artefato)
  vec2 dir = uv - m;
  float d = length(dir);
  float falloff = exp(-d * d * 18.0);
  vec2 guv = uv - dir * falloff * 0.25;

  // grade com deriva lentíssima (o fundo nunca fica morto)
  vec2 g = guv * 14.0 + u_time * vec2(0.018, -0.010);
  vec2 cf = fract(g);
  vec2 db = min(cf, 1.0 - cf);                       // distância até a linha
  float lx = 1.0 - smoothstep(0.0, 0.013, db.x);     // linha fina (~2px)
  float ly = 1.0 - smoothstep(0.0, 0.013, db.y);
  float line = max(lx, ly);

  // luz no cursor + ondas suaves saindo dele
  float glow = exp(-d * d * 7.0);
  float ripple = max(sin(d * 16.0 - u_time * 2.6), 0.0) * exp(-d * 2.6);
  float alpha = 0.12 + glow * 0.40 + ripple * 0.16;

  // fundo: radial sutil, um pouco mais claro no centro
  float radial = exp(-pow(length(uv - center) * 1.4, 2.0));
  vec3 color = mix(vec3(0.025, 0.030, 0.062), vec3(0.055, 0.068, 0.115), radial);

  color += vec3(0.78, 0.86, 1.0) * line * alpha;
  color += vec3(0.10, 0.16, 0.30) * glow * 0.55;

  // vinheta + dither
  color *= 1.0 - 0.40 * smoothstep(0.5, 1.15, length((uv - center) * vec2(1.0, 1.3)));
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`,
});
