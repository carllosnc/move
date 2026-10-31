// Nebula — ruído em camadas com gradiente colorido, estilo galáxia.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "nebula",
  name: "Nebulosa",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

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

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);

  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p);
    p = rot * p * 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float t = u_time * 0.03; // movimento lento, adequado para fundo de hero

  // Dominação do ruído em várias frequências
  float n = fbm(uv * 2.5 + vec2(t, -t * 0.6));
  n += 0.5 * fbm(uv * 5.0 - vec2(t * 0.8, t));

  // Cores da nebulosa
  vec3 deep = vec3(0.02, 0.01, 0.08);
  vec3 blue = vec3(0.10, 0.25, 0.75);
  vec3 pink = vec3(0.75, 0.20, 0.65);
  vec3 orange = vec3(0.95, 0.55, 0.25);

  vec3 color = mix(deep, blue, smoothstep(0.25, 0.65, n));
  color = mix(color, pink, smoothstep(0.55, 0.85, n) * 0.6);
  color = mix(color, orange, smoothstep(0.75, 1.0, n) * 0.3);

  // Brilho central suave
  float glow = exp(-0.9 * length(uv));
  color += vec3(0.15, 0.10, 0.25) * glow;

  // Ajustes para background de hero: dessatura, escurece e vinheta
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(color, vec3(lum), 0.18);
  color *= 0.72;
  color *= 1.0 - 0.35 * smoothstep(0.5, 1.6, length(uv));

  gl_FragColor = vec4(color, 1.0);
}
`,
});
