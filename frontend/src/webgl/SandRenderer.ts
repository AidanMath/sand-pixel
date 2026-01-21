import type { SandGrain, SimulationSettings } from '../types/sand.types';
import { DEFAULT_SETTINGS } from '../types/sand.types';
import { SAND_VERTEX_SHADER, SAND_FRAGMENT_SHADER, createProgram } from './shaders';

export class SandRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private quadBuffer: WebGLBuffer;
  private offsetBuffer: WebGLBuffer;
  private colorBuffer: WebGLBuffer;
  private grainCount: number = 0;
  private settings: SimulationSettings;

  // Pre-allocated buffers to avoid GC stuttering
  private offsetData: Float32Array;
  private colorData: Float32Array;
  private bufferCapacity: number = 0;

  // Uniform locations
  private resolutionLocation: WebGLUniformLocation;
  private pixelSizeLocation: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement, settings: SimulationSettings = DEFAULT_SETTINGS) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error('WebGL 2 not supported');
    }

    this.gl = gl;
    this.settings = settings;

    // Create shader program
    this.program = createProgram(gl, SAND_VERTEX_SHADER, SAND_FRAGMENT_SHADER);

    // Get uniform locations with validation
    const resolutionLoc = gl.getUniformLocation(this.program, 'u_resolution');
    const pixelSizeLoc = gl.getUniformLocation(this.program, 'u_pixelSize');
    if (!resolutionLoc || !pixelSizeLoc) {
      throw new Error('Failed to get shader uniform locations');
    }
    this.resolutionLocation = resolutionLoc;
    this.pixelSizeLocation = pixelSizeLoc;

    // Create VAO with validation
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error('Failed to create vertex array object');
    }
    this.vao = vao;
    gl.bindVertexArray(this.vao);

    // Create quad buffer (unit square, will be scaled by pixel size)
    const quadBuffer = gl.createBuffer();
    if (!quadBuffer) {
      throw new Error('Failed to create quad buffer');
    }
    this.quadBuffer = quadBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const quadVertices = new Float32Array([
      0, 0,  // bottom-left
      1, 0,  // bottom-right
      0, 1,  // top-left
      0, 1,  // top-left
      1, 0,  // bottom-right
      1, 1,  // top-right
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Set up quad attribute
    const positionLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Create instance buffers with validation
    const offsetBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    if (!offsetBuffer || !colorBuffer) {
      throw new Error('Failed to create instance buffers');
    }
    this.offsetBuffer = offsetBuffer;
    this.colorBuffer = colorBuffer;

    // Set up offset attribute (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
    const offsetLoc = gl.getAttribLocation(this.program, 'a_offset');
    gl.enableVertexAttribArray(offsetLoc);
    gl.vertexAttribPointer(offsetLoc, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(offsetLoc, 1); // One per instance

    // Set up color attribute (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    const colorLoc = gl.getAttribLocation(this.program, 'a_color');
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(colorLoc, 1); // One per instance

    gl.bindVertexArray(null);

    // Set clear color (dark background)
    gl.clearColor(0.05, 0.05, 0.1, 1.0);

    // Initialize buffers with reasonable capacity
    this.bufferCapacity = 10000;
    this.offsetData = new Float32Array(this.bufferCapacity * 2);
    this.colorData = new Float32Array(this.bufferCapacity * 4);
  }

  resize(width: number, height: number): void {
    const gl = this.gl;
    gl.canvas.width = width;
    gl.canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  updateGrains(grains: SandGrain[]): void {
    const gl = this.gl;

    // Count visible grains and ensure buffer capacity
    let visibleCount = 0;
    for (let i = 0; i < grains.length; i++) {
      if (grains[i].active && grains[i].y >= 0) visibleCount++;
    }

    this.grainCount = visibleCount;
    if (this.grainCount === 0) return;

    // Grow buffers if needed (only reallocate when necessary)
    if (this.grainCount > this.bufferCapacity) {
      this.bufferCapacity = Math.ceil(this.grainCount * 1.5);
      this.offsetData = new Float32Array(this.bufferCapacity * 2);
      this.colorData = new Float32Array(this.bufferCapacity * 4);
    }

    // Fill buffers inline (avoids creating intermediate array)
    let idx = 0;
    for (let i = 0; i < grains.length; i++) {
      const grain = grains[i];
      if (!grain.active || grain.y < 0) continue;

      const offset2 = idx * 2;
      const offset4 = idx * 4;
      this.offsetData[offset2] = grain.x;
      this.offsetData[offset2 + 1] = grain.y;
      this.colorData[offset4] = grain.color[0];
      this.colorData[offset4 + 1] = grain.color[1];
      this.colorData[offset4 + 2] = grain.color[2];
      this.colorData[offset4 + 3] = grain.color[3];
      idx++;
    }

    // Upload using subarray view of the pre-allocated buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.offsetData.subarray(0, this.grainCount * 2), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorData.subarray(0, this.grainCount * 4), gl.DYNAMIC_DRAW);
  }

  render(): void {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.grainCount === 0) return;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.pixelSizeLocation, this.settings.pixelSize);

    // Draw all grains with instancing
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.grainCount);

    gl.bindVertexArray(null);
  }

  updateSettings(settings: Partial<SimulationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteBuffer(this.offsetBuffer);
    gl.deleteBuffer(this.colorBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}
