// Fluid — distorção de domínio sobre fbm (efeito de tinta/fumaça dissolvendo).
// Visual premium, movimento bem lento.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "fluid",
  name: "Fluido",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

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

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rot * p * 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float t = u_time * 0.05;

  // distorção de domínio em duas camadas (estilo Inigo Quilez)
  vec2 q = vec2(fbm(uv + t * 0.3),
                fbm(uv + vec2(5.2, 1.3) - t * 0.2));

  vec2 r = vec2(fbm(uv + 1.8 * q + vec2(1.7, 9.2) + t * 0.35),
                fbm(uv + 1.8 * q + vec2(8.3, 2.8) + t * 0.25));

  float f = fbm(uv + 2.2 * r);

  vec3 deep = vec3(0.03, 0.04, 0.12);
  vec3 blue = vec3(0.10, 0.35, 0.85);
  vec3 teal = vec3(0.10, 0.75, 0.75);
  vec3 pink = vec3(0.90, 0.30, 0.65);

  vec3 color = mix(deep, blue, smoothstep(0.20, 0.70, f));
  color = mix(color, teal, smoothstep(0.50, 0.90, q.x) * 0.5);
  color = mix(color, pink, smoothstep(0.60, 1.00, r.y) * 0.45);

  // ajustes para background de hero
  color *= 0.85;
  color *= 1.0 - 0.3 * smoothstep(0.6, 1.7, length(uv));

  gl_FragColor = vec4(color, 1.0);
}
`,
});
