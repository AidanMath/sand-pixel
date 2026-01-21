interface DrawingToolsProps {
  brushColor: string;
  brushSize: number;
  tool: 'brush' | 'eraser' | 'fill';
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onToolChange: (tool: 'brush' | 'eraser' | 'fill') => void;
  onUndo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const COLORS = [
  '#FFFFFF', '#C0C0C0', '#808080', '#000000',
  '#FF0000', '#800000', '#FFFF00', '#808000',
  '#00FF00', '#008000', '#00FFFF', '#008080',
  '#0000FF', '#000080', '#FF00FF', '#800080',
  '#FFA500', '#A52A2A', '#FFC0CB', '#FFD700',
];

const BRUSH_SIZES = [4, 8, 16, 24, 36];

export function DrawingTools({
  brushColor,
  brushSize,
  tool,
  onColorChange,
  onSizeChange,
  onToolChange,
  onUndo,
  onClear,
  disabled = false,
}: DrawingToolsProps) {
  return (
    <div className={`bg-zinc-800 rounded-lg p-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Tools */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onToolChange('brush')}
          className={`flex-1 py-2 px-3 rounded transition ${
            tool === 'brush'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => onToolChange('eraser')}
          className={`flex-1 py-2 px-3 rounded transition ${
            tool === 'eraser'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          onClick={() => onToolChange('fill')}
          className={`flex-1 py-2 px-3 rounded transition ${
            tool === 'fill'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.228 18.732l1.768-1.768 1.767 1.768a2.5 2.5 0 11-3.535 0zM8.878 1.08l11.314 11.313a1 1 0 010 1.415l-8.485 8.485a1 1 0 01-1.414 0L.979 13.072a1 1 0 010-1.414l8.485-8.485a1 1 0 011.414-.092zm.707 3.536L3.1 11.1l7.07 7.071 6.537-6.536-7.122-7.02z" />
          </svg>
        </button>
      </div>

      {/* Color palette */}
      <div className="mb-4">
        <div className="text-xs text-zinc-400 mb-2">Colors</div>
        <div className="grid grid-cols-10 gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded border-2 transition ${
                brushColor === color
                  ? 'border-blue-500 scale-110'
                  : 'border-zinc-600 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Current color preview */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-xs text-zinc-400">Current:</div>
        <div
          className="w-8 h-8 rounded border-2 border-zinc-600"
          style={{ backgroundColor: brushColor }}
        />
      </div>

      {/* Brush size */}
      <div className="mb-4">
        <div className="text-xs text-zinc-400 mb-2">Brush Size</div>
        <div className="flex gap-2 items-center justify-center">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`flex items-center justify-center rounded transition ${
                brushSize === size
                  ? 'bg-blue-600'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
              style={{ width: 40, height: 40 }}
            >
              <div
                className="rounded-full bg-white"
                style={{
                  width: Math.min(size, 32),
                  height: Math.min(size, 32),
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          className="flex-1 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition"
        >
          Undo
        </button>
        <button
          onClick={onClear}
          className="flex-1 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
