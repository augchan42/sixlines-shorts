shader_type canvas_item;
uniform float lines = 640.0;
uniform float strength = 0.18;
void fragment() {
	float s = step(0.5, fract(SCREEN_UV.y * lines));
	COLOR = vec4(0.0, 0.0, 0.0, strength * s);
}
