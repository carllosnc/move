// Plasma — o clássico efeito de plasma com paleta animada.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "plasma",
  name: "Plasma",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

// Paleta em seno (tipo IQ / Inigo Quilez), tonalizada para fundo de hero:
// tons profundos de azul/roxo com brilho baixo, para o texto por cima continuar legível.
vec3 palette(float t) {
  vec3 a = vec3(0.16, 0.14, 0.26); // base escura e fria
  vec3 b = vec3(0.14, 0.12, 0.22); // amplitude pequena = pouca saturação
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.55, 0.45, 0.72); // deslocamento para o espectro azul-roxo
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float t = u_time * 0.17; // 0.08 antes — movimento um pouco mais perceptível

  // Soma de senos deslocados no tempo e no espaço
  float v = 0.0;
  v += sin(uv.x * 3.0 + t);
  v += sin(uv.y * 3.0 + t * 0.7);
  v += sin((uv.x + uv.y) * 2.0 + t * 1.3);
  v += sin(length(uv * 1.5) * 4.0 - t * 1.7);
  v += 0.5 * sin(uv.x * 5.0 - uv.y * 4.0 + t * 2.1); // quarta onda, mais fina
  v *= 0.20; // normaliza

  vec3 color = palette(v + t * 0.07);

  // Ajustes para background de hero: brilho controlado, vinheta e dither contra banding
  color *= 1.5;
  color *= 1.0 - 0.4 * smoothstep(0.7, 1.8, length(uv));
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`,
});
