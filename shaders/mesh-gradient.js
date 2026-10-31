// Mesh Gradient — blobs de cor deslizando devagar sobre base escura.
// Estilo Stripe/Linear, o clássico de hero de SaaS. Máxima legibilidade.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "mesh",
  name: "Mesh",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

float blob(vec2 p, vec2 c, float r) {
  float d2 = dot(p - c, p - c);
  return exp(-d2 / (r * r));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * 0.28;

  // distorção de domínio: o fundo inteiro ondula devagar junto com os blobs
  p += 0.045 * vec2(
    sin(p.y * 6.0 + u_time * 0.9) + sin(p.y * 2.5 - u_time * 0.5),
    cos(p.x * 5.0 - u_time * 0.8) + cos(p.x * 3.0 + u_time * 0.6)
  );

  // base escura: sobra área limpa para o texto do hero
  vec3 color = vec3(0.03, 0.03, 0.07);

  // blobs em órbitas rápidas e desencontradas
  vec2 c1 = vec2(0.30 * aspect + 0.42 * sin(t * 1.10),          0.35 + 0.34 * cos(t * 0.80));
  vec2 c2 = vec2(0.75 * aspect + 0.36 * sin(t * 0.90 + 2.1), 0.70 + 0.30 * sin(t * 1.20 + 1.0));
  vec2 c3 = vec2(0.55 * aspect + 0.40 * cos(t * 0.70 + 4.0), 0.25 + 0.34 * sin(t * 1.05 + 3.0));
  vec2 c4 = vec2(0.15 * aspect + 0.32 * cos(t * 1.15 + 1.5), 0.85 + 0.28 * sin(t * 0.95 + 5.2));
  vec2 c5 = vec2(0.50 * aspect + 0.45 * sin(t * 0.60 + 0.7), 0.55 + 0.30 * cos(t * 1.30 + 2.2));

  // raios que respiram: pulsam junto com o movimento
  float r1 = 0.34 + 0.10 * sin(t * 1.7);
  float r2 = 0.38 + 0.12 * cos(t * 1.5 + 1.0);
  float r3 = 0.27 + 0.08 * sin(t * 1.9 + 2.5);
  float r4 = 0.29 + 0.09 * cos(t * 1.4 + 4.0);
  float r5 = 0.26 + 0.10 * sin(t * 2.1 + 0.5);

  color += vec3(0.45, 0.20, 0.95) * blob(p, c1, r1); // violeta
  color += vec3(0.10, 0.35, 0.95) * blob(p, c2, r2); // azul
  color += vec3(0.95, 0.25, 0.55) * blob(p, c3, r3); // rosa
  color += vec3(0.10, 0.75, 0.70) * blob(p, c4, r4); // turquesa
  color += vec3(0.95, 0.60, 0.15) * blob(p, c5, r5) * 0.8; // âmbar

  // tone mapping suave: nunca estoura em branco
  color = 1.0 - exp(-color * 1.3);

  // vinheta
  color *= 1.0 - 0.35 * smoothstep(0.6, 1.6, length(uv - 0.5) * 1.6);

  gl_FragColor = vec4(color, 1.0);
}
`,
});
