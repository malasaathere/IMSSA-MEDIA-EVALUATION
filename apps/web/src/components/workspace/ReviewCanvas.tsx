import React, { useState } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';

interface Annotation {
  id: string;
  type: 'pin' | 'rect';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export function ReviewCanvas() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pointer' | 'pin' | 'rect'>('pointer');

  const handleMouseDown = (e: any) => {
    if (currentTool === 'pointer') return;
    
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (currentTool === 'pin') {
      setAnnotations([...annotations, { id: Date.now().toString(), type: 'pin', x: pos.x, y: pos.y }]);
      setCurrentTool('pointer');
    } else if (currentTool === 'rect') {
      setIsDrawing(true);
      setAnnotations([...annotations, { id: Date.now().toString(), type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0 }]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || currentTool !== 'rect') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    let lastRect = annotations[annotations.length - 1];
    lastRect.width = point.x - lastRect.x;
    lastRect.height = point.y - lastRect.y;

    annotations.splice(annotations.length - 1, 1, lastRect);
    setAnnotations(annotations.concat());
  };

  const handleMouseUp = () => {
    if (currentTool === 'rect') {
      setIsDrawing(false);
      setCurrentTool('pointer');
    }
  };

  return (
    <div className="relative border-2 border-border bg-white rounded-lg shadow-sm">
      <div className="absolute top-4 right-4 z-10 flex space-x-2 bg-white rounded-md shadow p-1 border border-border">
        <button 
          className={`px-3 py-1 text-sm rounded ${currentTool === 'pointer' ? 'bg-surface-selected text-navy-950 font-medium' : 'text-text-muted hover:bg-surface'}`}
          onClick={() => setCurrentTool('pointer')}
        >Pointer</button>
        <button 
          className={`px-3 py-1 text-sm rounded ${currentTool === 'pin' ? 'bg-surface-selected text-navy-950 font-medium' : 'text-text-muted hover:bg-surface'}`}
          onClick={() => setCurrentTool('pin')}
        >Add Pin</button>
        <button 
          className={`px-3 py-1 text-sm rounded ${currentTool === 'rect' ? 'bg-surface-selected text-navy-950 font-medium' : 'text-text-muted hover:bg-surface'}`}
          onClick={() => setCurrentTool('rect')}
        >Draw Box</button>
      </div>

      {/* Konva Stage acting as an overlay over the image */}
      <Stage 
        width={800} 
        height={600} 
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        className={currentTool !== 'pointer' ? 'cursor-crosshair' : 'cursor-default'}
      >
        <Layer>
          {annotations.map((ann) => {
            if (ann.type === 'pin') {
              return (
                <Circle 
                  key={ann.id}
                  x={ann.x} 
                  y={ann.y} 
                  radius={12} 
                  fill="#B42318" 
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  shadowBlur={4}
                  shadowColor="rgba(0,0,0,0.3)"
                />
              );
            } else if (ann.type === 'rect') {
              return (
                <Rect 
                  key={ann.id}
                  x={ann.x} 
                  y={ann.y} 
                  width={ann.width} 
                  height={ann.height} 
                  stroke="#B42318" 
                  strokeWidth={3}
                  dash={[5, 5]}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
