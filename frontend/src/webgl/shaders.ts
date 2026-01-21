// Vertex shader for instanced sand grain rendering
export const SAND_VERTEX_SHADER = `#version 300 es
precision highp float;

// Per-vertex attributes (quad corners)
in vec2 a_position;

// Per-instance attributes (one per grain)
in vec2 a_offset;
in vec4 a_color;

// Uniforms
uniform vec2 u_resolution;
uniform float u_pixelSize;

// Outputs to fragment shader
out vec4 v_color;

void main() {
    // Scale quad by pixel size and offset by grain position
    vec2 pos = a_position * u_pixelSize + a_offset;

    // Convert from pixel coordinates to clip space (-1 to 1)
    vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;

    // Flip Y axis (canvas Y goes down, WebGL Y goes up)
    clipSpace.y = -clipSpace.y;

    gl_Position = vec4(clipSpace, 0.0, 1.0);
    v_color = a_color;
}
`;

// Fragment shader for sand grains
export const SAND_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
    fragColor = v_color;
}
`;

// Utility function to compile a shader
export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }

  return shader;
}

// Create and link a shader program
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${info}`);
  }

  // Clean up shaders (they're now part of the program)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}
