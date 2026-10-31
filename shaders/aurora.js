// Aurora — fitas de luz ondulando num céu escuro, penduradas no topo.
// Base inferior escura para o título do hero.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "aurora",
  name: "Aurora",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

// Uma fita de aurora: curva ondulante em x, com estrias de cortina
float ribbon(vec2 uv, float phase, float speed, float amp, float baseY, float width) {
  float x = uv.x * 3.5;
  float y = baseY
         + 0.04 * sin(u_time * speed * 0.8 + phase)          // fita inteira sobe e desce
         + amp * 0.55 * sin(x * 1.3 + phase + u_time * speed * 1.9)
         + amp * 0.30 * sin(x * 2.7 - phase * 0.7 - u_time * speed * 1.4)
         + amp * 0.18 * sin(x * 5.1 + phase * 1.6 + u_time * speed * 2.6); // terceira onda, mais rápida

  float d = (uv.y - y) / (width * (1.0 + 0.20 * sin(u_time * speed * 1.3 + phase)));
  float g = exp(-d * d);

  // estrias verticais (cortina) deslizando para a direita, sem flicker
  float stripes = 0.80
                + 0.14 * sin(uv.x * 42.0 + phase * 3.0 + u_time * speed * 2.2)
                + 0.06 * sin(uv.x * 17.0 - phase - u_time * speed * 1.1);
  return g * stripes;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // céu noturno
  vec3 color = mix(vec3(0.02, 0.02, 0.05), vec3(0.03, 0.05, 0.11), uv.y);

  // deriva horizontal: a cortina inteira viaja devagar para a direita.
  // O seno torna o ciclo infinito — nada sai da tela com o tempo.
  float drift = 0.35 * sin(u_time * 0.06);
  vec2 uvRib = uv + vec2(drift, 0.0);

  float g1 = ribbon(uvRib, 0.0, 0.34, 0.14, 0.86, 0.22); // fita principal (verde)
  float g2 = ribbon(uvRib, 2.4, 0.25, 0.18, 0.93, 0.30); // fita ampla (roxa)
  float g3 = ribbon(uvRib, 4.8, 0.42, 0.10, 0.76, 0.15); // fita fina (ciano)

  color += vec3(0.10, 0.80, 0.50) * g1;
  color += vec3(0.45, 0.20, 0.90) * g2 * 0.55;
  color += vec3(0.15, 0.55, 0.95) * g3 * 0.45;

  color = 1.0 - exp(-color * 1.25);

  // vinheta
  color *= 1.0 - 0.3 * smoothstep(0.7, 1.7, length(uv - 0.5) * 1.5);

  gl_FragColor = vec4(color, 1.0);
}
`,
});
