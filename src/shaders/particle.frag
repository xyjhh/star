precision highp float;

uniform sampler2D uTexture;

varying vec2 vPUv;
varying vec2 vUv;

void main() {
  vec4 color = vec4(0.0);
  vec2 uv = vUv;
  vec2 puv = vPUv;

  // pixel color
  vec4 colA = texture2D(uTexture, puv);

  // 保持原始颜色
  vec4 colB = colA;

  // circle
  float border = 0.3;
  float radius = 0.5;
  float dist = radius - distance(uv, vec2(0.5));
  float t = smoothstep(0.0, border, dist);

  // final color
  color = colB;
  color.a = t;

  // 可选：加颜色调整，让更梦幻（比如偏紫粉）
  // color.rgb *= vec3(1.0, 0.5, 0.8);

  gl_FragColor = color;
}
