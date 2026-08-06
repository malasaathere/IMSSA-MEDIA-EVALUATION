"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { Maximize, Minimize, MousePointer2, MapPin, Square } from 'lucide-react';

interface Annotation {
  id: string;
  type: 'pin' | 'rect';
  nx: number; // normalized x (0 to 1)
  ny: number; // normalized y (0 to 1)
  nw?: number; // normalized width (0 to 1)
  nh?: number; // normalized height (0 to 1)
}

interface ReviewCanvasProps {
  imageUrl?: string;
  initialAnnotations?: Annotation[];
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}

export function ReviewCanvas({ imageUrl, initialAnnotations = [], onAnnotationsChange }: ReviewCanvasProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pointer' | 'pin' | 'rect'>('pointer');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 320, height: 240 });
  const [isFitToScreen, setIsFitToScreen] = useState(false);

  // Measure container and update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth - 32;
        if (isFitToScreen) {
          // Fill available space (e.g. fixed window height minus offset)
          setDimensions({
            width: Math.max(280, availableWidth),
            height: Math.max(280, window.innerHeight - 240)
          });
        } else {
          // Default fixed size for original aspect ratio testing
          const width = Math.min(800, Math.max(280, availableWidth));
          setDimensions({ width, height: Math.round(width * 0.75) });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFitToScreen]);

  const handleMouseDown = (e: any) => {
    if (currentTool === 'pointer') return;
    
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    // Convert pixel to normalized
    const nx = pos.x / dimensions.width;
    const ny = pos.y / dimensions.height;

    if (currentTool === 'pin') {
      const newAnns = [...annotations, { id: Date.now().toString(), type: 'pin' as const, nx, ny }];
      setAnnotations(newAnns);
      onAnnotationsChange?.(newAnns);
      setCurrentTool('pointer');
    } else if (currentTool === 'rect') {
      setIsDrawing(true);
      setAnnotations([...annotations, { id: Date.now().toString(), type: 'rect' as const, nx, ny, nw: 0, nh: 0 }]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || currentTool !== 'rect') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    const nx = point.x / dimensions.width;
    const ny = point.y / dimensions.height;

    let lastRect = annotations[annotations.length - 1];
    lastRect.nw = nx - lastRect.nx;
    lastRect.nh = ny - lastRect.ny;

    const updated = annotations.slice(0, -1).concat(lastRect);
    setAnnotations(updated);
  };

  const handleMouseUp = () => {
    if (currentTool === 'rect' && isDrawing) {
      setIsDrawing(false);
      setCurrentTool('pointer');
      onAnnotationsChange?.(annotations);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex space-x-1">
          <button 
            className={`p-2 rounded-md flex items-center ${currentTool === 'pointer' ? 'bg-navy-100 text-navy-700' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={() => setCurrentTool('pointer')}
            title="Select/Move"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button 
            className={`p-2 rounded-md flex items-center ${currentTool === 'pin' ? 'bg-navy-100 text-navy-700' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={() => setCurrentTool('pin')}
            title="Drop Pin"
          >
            <MapPin className="w-4 h-4" />
          </button>
          <button 
            className={`p-2 rounded-md flex items-center ${currentTool === 'rect' ? 'bg-navy-100 text-navy-700' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={() => setCurrentTool('rect')}
            title="Draw Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        <div className="flex space-x-1">
          <button
            className={`p-2 rounded-md flex items-center ${isFitToScreen ? 'bg-navy-100 text-navy-700' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={() => setIsFitToScreen(!isFitToScreen)}
            title={isFitToScreen ? "Actual Size" : "Fit to Screen"}
          >
            {isFitToScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className={`relative max-w-full border border-slate-200 bg-slate-100 rounded-lg overflow-hidden flex justify-center items-center ${isFitToScreen ? 'w-full' : 'mx-auto shadow-md'}`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Review Draft" 
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            No media selected
          </div>
        )}

        <Stage 
          width={dimensions.width} 
          height={dimensions.height} 
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          className={`absolute inset-0 ${currentTool !== 'pointer' ? 'cursor-crosshair' : 'cursor-default'}`}
        >
          <Layer>
            {annotations.map((ann) => {
              // Convert normalized back to pixel for rendering
              const px = ann.nx * dimensions.width;
              const py = ann.ny * dimensions.height;
              
              if (ann.type === 'pin') {
                return (
                  <Circle 
                    key={ann.id}
                    x={px} 
                    y={py} 
                    radius={6} 
                    fill="#f59e0b" // gold-500
                    stroke="#ffffff"
                    strokeWidth={2}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowBlur={4}
                    shadowOffset={{x: 1, y: 1}}
                  />
                );
              }
              
              if (ann.type === 'rect' && ann.nw !== undefined && ann.nh !== undefined) {
                const pw = ann.nw * dimensions.width;
                const ph = ann.nh * dimensions.height;
                return (
                  <Rect 
                    key={ann.id}
                    x={px} 
                    y={py} 
                    width={pw} 
                    height={ph} 
                    stroke="#f59e0b" // gold-500
                    strokeWidth={2}
                    dash={[5, 5]}
                    fill="rgba(245, 158, 11, 0.1)"
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
