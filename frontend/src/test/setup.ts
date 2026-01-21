import '@testing-library/jest-dom';

// Mock WebGL context
class MockWebGL2RenderingContext {
  canvas = { width: 800, height: 600 };
  clearColor = vi.fn();
  clear = vi.fn();
  createShader = vi.fn(() => ({}));
  shaderSource = vi.fn();
  compileShader = vi.fn();
  getShaderParameter = vi.fn(() => true);
  createProgram = vi.fn(() => ({}));
  attachShader = vi.fn();
  linkProgram = vi.fn();
  getProgramParameter = vi.fn(() => true);
  useProgram = vi.fn();
  getUniformLocation = vi.fn(() => ({}));
  getAttribLocation = vi.fn(() => 0);
  createBuffer = vi.fn(() => ({}));
  bindBuffer = vi.fn();
  bufferData = vi.fn();
  enableVertexAttribArray = vi.fn();
  vertexAttribPointer = vi.fn();
  vertexAttribDivisor = vi.fn();
  createVertexArray = vi.fn(() => ({}));
  bindVertexArray = vi.fn();
  viewport = vi.fn();
  uniform2f = vi.fn();
  uniform1f = vi.fn();
  drawArraysInstanced = vi.fn();
  deleteBuffer = vi.fn();
  deleteVertexArray = vi.fn();
  deleteProgram = vi.fn();
  deleteShader = vi.fn();
  COLOR_BUFFER_BIT = 16384;
  ARRAY_BUFFER = 34962;
  STATIC_DRAW = 35044;
  DYNAMIC_DRAW = 35048;
  FLOAT = 5126;
  TRIANGLES = 4;
  VERTEX_SHADER = 35633;
  FRAGMENT_SHADER = 35632;
  COMPILE_STATUS = 35713;
  LINK_STATUS = 35714;
}

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl2') {
    return new MockWebGL2RenderingContext() as unknown as WebGL2RenderingContext;
  }
  return null;
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
