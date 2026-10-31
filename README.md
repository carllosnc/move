# Shader Gallery

Página única que renderiza shaders WebGL em full viewport, para uso como
background. Cada shader fica em seu próprio arquivo dentro de `shaders/`.

## Rodando

Por usar arquivos `.js` comuns (sem modules), basta abrir o `index.html`
direto no navegador. Se preferir um servidor:

```bash
npx serve .
# ou
python -m http.server
```

## Navegação

- Botões na parte inferior da tela
- Teclas `1`, `2`, `3`... para ir direto ao shader (até o 9º; os demais
  pelas setas ou clique no botão)
- Setas `←` / `→` para ciclar
- `H` para esconder/mostrar a interface
- A URL guarda o shader ativo (ex.: `index.html#nebula`)

## Adicionando um shader novo

1. Crie `shaders/meushader.js`:

```js
window.SHADERS = window.SHADERS || [];

window.SHADERS.push({
  id: "meushader",          // usado na URL
  name: "Meu Shader",       // exibido no botão
  fragment: `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  gl_FragColor = vec4(uv, 0.5 + 0.5 * sin(u_time), 1.0);
}
`,
});
```

2. Inclua no `index.html`, antes de `js/renderer.js`:

```html
<script src="shaders/meushader.js"></script>
```

## Uniforms disponíveis

| Uniform         | Tipo   | Descrição                        |
| --------------- | ------ | -------------------------------- |
| `u_time`        | `float`| Tempo decorrido em segundos      |
| `u_resolution`  | `vec2` | Resolução do canvas em pixels    |
| `u_mouse`       | `vec2` | Posição do cursor (0–1, y para cima), com suavização |
| `u_mouseIdle`   | `float`| Segundos desde o último movimento do mouse |
| `u_mouseFocus`  | `float`| 0–1, suavizado: 1 enquanto o mouse está ativo, volta a 0 quando ocioso |
| `u_mouseVel`    | `vec2` | Velocidade do mouse (unidades/s) — para efeitos de elasticidade |

Os listeners de mouse ficam na `window`, então funcionam mesmo com o
conteúdo do hero cobrindo o canvas. O `u_mouse` inicia em `(0.5, 0.5)` e o
`u_mouseIdle` começa alto. Para recentralizar sozinhos quando o cursor fica
parado, prefira o `u_mouseFocus`: ele já vem como filtro passa-baixo do
renderer, então a mistura é contínua (sem salto nem na ida nem na volta).
O `u_mouseIdle` segue disponível, mas note que ele zera de uma vez no
primeiro movimento — usar `exp(-u_mouseIdle * k)` direto causa um "pulo"
no efeito ao reativar o cursor.

O vertex shader (`vec2 a_position` cobrindo a tela) já é fornecido pelo
renderer — só é preciso escrever o fragment shader.

## Shaders incluídos

| # | ID | Nome | Visual |
|---|----|------|--------|
| 1 | `#nebula` | Nebulosa | ruído fbm com paleta de galáxia, dessaturado |
| 2 | `#plasma` | Plasma | clássico plasma, escurecido e lento |
| 3 | `#starfield` | Estrelas | 4 camadas em paralaxe, estrelas frias/quentes sobre gradiente azul→roxo |
| 4 | `#mesh` | Mesh | blobs de cor deslizando (estilo Stripe) |
| 5 | `#aurora` | Aurora | fitas de luz penduradas no topo |
| 6 | `#fluid` | Fluido | tinta dissolvendo (domain warp) |
| 7 | `#grid` | Grid | grade minimalista de linhas finas; luz no cursor + elevação suave das linhas |
| 8 | `#topografia` | Topografia | curvas de nível de um relevo em deriva lenta; o cursor ilumina o mapa |
| 9 | `#linhas` | Linhas | fita de linhas azuis e ciano fluindo continuamente de um canto a outro da tela com movimento ondulatório |

Todos foram ajustados para uso em **hero section**: movimento lento
(velocidade ≤ 0.1), regiões escuras para o texto e vinheta suave.

## Usando como background de hero

Como os shaders já vêm escurecidos, em geral basta o overlay de gradiente
do próprio hero para garantir contraste do título:

```css
.hero {
  position: relative;
  min-height: 100vh;
}

/* o iframe/canvas do shader fica em z-index 0 */
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* overlay que garante legibilidade do texto */
.hero__bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.55) 100%
  );
}

.hero__content {
  position: relative;
  z-index: 1;
}
```

Dicas:

- **Movimento**: mantenha multiplicadores de `u_time` ≤ 0.1 — já é o padrão aqui
- **Acessibilidade**: o renderer congela a animação automaticamente quando o
  sistema tem `prefers-reduced-motion: reduce`
- **Performance**: em hero que fica muito tempo na tela, evite mais de
  ~5 chamadas de fbm com 4+ oitavas por pixel
