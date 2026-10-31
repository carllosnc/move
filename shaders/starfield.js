// Starfield — 4 camadas de estrelas em paralaxe sobre gradiente azul → roxo.
// Estrelas com variação de cor (frias e quentes) e cintilação suave.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "starfield",
  name: "Estrelas",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Uma camada de estrelas; retorna luz já tingida com a cor da estrela
vec3 stars(vec2 uv, float scale, float density, float radius, float seed) {
  vec2 gv = fract(uv * scale) - 0.5;
  vec2 id = floor(uv * scale);

  float r = hash(id + seed);
  float brightness = smoothstep(1.0 - density, 1.0, r);
  if (brightness <= 0.0) return vec3(0.0);

  // posição aleatória da estrela dentro da célula
  vec2 offset = vec2(hash(id + 1.3), hash(id + 4.7)) - 0.5;
  float d = length(gv - offset * 0.8);

  float twinkle = 0.74 + 0.26 * sin(u_time * (0.4 + r * 2.0) + r * 40.0);
  float core = brightness * smoothstep(radius, 0.0, d) * twinkle;

  // cor por estrela: maioria fria (azulada), algumas quentes (alaranjada)
  float warm = smoothstep(0.72, 1.0, hash(id + 2.9));
  vec3 tint = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.86, 0.66), warm);

  return tint * core;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float t = u_time * 0.02;

  // gradiente vivo, mas escuro o bastante para o texto do hero
  float g = uv.y * 0.5 + 0.5;
  vec3 color = mix(vec3(0.03, 0.06, 0.15), vec3(0.05, 0.05, 0.17), smoothstep(0.0, 0.5, g));
  color = mix(color, vec3(0.11, 0.05, 0.24), smoothstep(0.5, 1.0, g));

  // brilho suave subindo do rodapé
  color += vec3(0.02, 0.07, 0.12) * exp(-pow((uv.y + 1.0) * 1.4, 2.0));

  // deriva lenta do campo
  vec2 drift = vec2(t, t * 0.3);

  // quatro camadas de profundidade paralaxe
  vec3 s = vec3(0.0);
  s += stars(uv + drift * 0.4, 4.0, 0.10, 0.05, 0.0) * 1.00;
  s += stars(uv + drift * 0.7, 8.0, 0.09, 0.05, 10.0) * 0.75;
  s += stars(uv + drift * 1.1, 14.0, 0.08, 0.06, 20.0) * 0.50;
  s += stars(uv + drift * 1.5, 20.0, 0.07, 0.08, 30.0) * 0.35;

  color += s * 0.9;

  // dither contra banding do gradiente
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`,
});
