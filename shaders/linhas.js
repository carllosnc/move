// Linhas — ondas de linhas azuis em fita estilizada fluindo de uma ponta à outra da tela.
// Inspirado em composições de ondas paramétricas, caustics e guilloché.
// Linhas ciano/elétricas brilhantes com movimento suave e contínuo sobre fundo escuro.
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "linhas",
  name: "Linhas",
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;       // 0..1, y para cima, com suavização
uniform float u_mouseFocus; // 0..1, suavizado pelo renderer (contínuo)

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  float px = 1.0 / u_resolution.y;

  // Fundo azul-marinho profundo com iluminação ambiente suave
  vec3 bg = mix(vec3(0.003, 0.007, 0.022), vec3(0.006, 0.015, 0.046), uv.y);
  
  // Brilho difuso sutil no centro acompanhando a faixa de ondas
  float centerGlow = exp(-pow((uv.y - 0.42) / 0.28, 2.0));
  bg += vec3(0.012, 0.045, 0.12) * centerGlow;

  vec3 col = bg;

  // Movimento contínuo e fluido de uma ponta à outra da tela
  float t = u_time * 0.45;

  // Interação com o cursor: ondulação magnética suave que deforma as linhas localmente
  vec2 m = u_mouse;
  float mDist = length((uv - m) * vec2(aspect, 1.0));
  float mInfluence = exp(-mDist * mDist * 16.0) * u_mouseFocus * 0.045;
  vec2 p = uv - (uv - m) * mInfluence;

  const int N = 28;
  for (int i = 0; i < N; i++) {
    // s varia de -1.0 (linha inferior) a +1.0 (linha superior)
    float s = (float(i) - float(N - 1) * 0.5) / (float(N - 1) * 0.5);

    // Variação orgânica da largura da fita ao longo da tela
    float ribbonWidth = 0.09 + 0.035 * cos(p.x * 3.6 - t * 0.4 + s * 0.35);

    // Torção de fase entre as linhas (cria o entrelaçamento e leque suave estilo fita/moiré)
    float twist1 = s * (0.38 + 0.12 * sin(p.x * 2.6 - t * 0.5));
    float twist2 = s * 0.55;

    // Altura base suave cruzando a tela
    float yBase = 0.40 + 0.05 * sin(p.x * 3.141592 - 0.3);

    // Ondas senoidais em deslocamento contínuo (da esquerda para a direita)
    float w1 = 0.135 * sin(p.x * 4.8 - t + twist1);
    float w2 = 0.048 * sin(p.x * 9.4 - t * 1.3 + twist2 + 0.85);
    float w3 = 0.016 * sin(p.x * 15.0 - t * 1.8 + s * 0.8);

    float yCurve = yBase + s * ribbonWidth + w1 + w2 + w3;

    // Cálculo da derivada numérica dy/dx para obter a distância perpendicular exata (anti-aliasing perfeito)
    float eps = 0.0025;
    float xE = p.x + eps;
    float ribbonWidthE = 0.09 + 0.035 * cos(xE * 3.6 - t * 0.4 + s * 0.35);
    float twist1E = s * (0.38 + 0.12 * sin(xE * 2.6 - t * 0.5));
    float yBaseE = 0.40 + 0.05 * sin(xE * 3.141592 - 0.3);
    float w1E = 0.135 * sin(xE * 4.8 - t + twist1E);
    float w2E = 0.048 * sin(xE * 9.4 - t * 1.3 + twist2 + 0.85);
    float w3E = 0.016 * sin(xE * 15.0 - t * 1.8 + s * 0.8);
    float yCurveE = yBaseE + s * ribbonWidthE + w1E + w2E + w3E;

    float dy_dx = (yCurveE - yCurve) / eps;
    float dist = abs(p.y - yCurve) / sqrt(1.0 + dy_dx * dy_dx);

    // Linha fina e nítida com halo luminoso suave
    float w = px * (1.05 + 0.25 * (1.0 - abs(s)));
    float core = 1.0 - smoothstep(0.0, w, dist);
    float halo = exp(-dist * dist / (w * w * 7.5)) * 0.45;

    // Atenuação sutil nas bordas da fita para profundidade tridimensional
    float edgeProfile = 1.0 - 0.32 * s * s;

    // Paleta: azul elétrico profundo nas bordas para ciano neon brilhante no centro
    vec3 lineCol = mix(vec3(0.03, 0.42, 0.92), vec3(0.20, 0.88, 1.0), 1.0 - abs(s) * 0.55);
    lineCol = mix(lineCol, vec3(0.78, 0.96, 1.0), core * 0.70);

    float alpha = (core + halo) * edgeProfile * 0.72;
    col += lineCol * alpha;
  }

  // Vinheta suave para ambientação de hero background
  float vig = 1.0 - 0.32 * smoothstep(0.55, 1.35, length((uv - 0.5) * vec2(1.0, 1.2)));
  col *= vig;

  // Dither imperceptível para prevenir banding no gradiente
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dither - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`,
});
