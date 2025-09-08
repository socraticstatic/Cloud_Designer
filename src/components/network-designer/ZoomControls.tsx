import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Rotate3D as RotateLeft, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFitToScreen?: () => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ZoomControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onFitToScreen,
  min = 0.5,
  max = 2,
  step = 0.1
}: ZoomControlsProps) {
  return (
    <div className="absolute top-20 right-4 z-50 bg-white/80 backdrop-blur-sm rounded-lg shadow-md flex flex-col">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onZoomIn();
        }}
        className="p-2 hover:bg-gray-100 rounded-t-lg"
        title="Zoom In"
        type="button"
      >
        <ZoomIn className="h-5 w-5 text-gray-600" />
      </button>
      
      <div className="h-px bg-gray-200 mx-1"></div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onZoomOut();
        }}
        className="p-2 hover:bg-gray-100"
        title="Zoom Out"
        type="button"
      >
        <ZoomOut className="h-5 w-5 text-gray-600" />
      </button>
      
      <div className="h-px bg-gray-200 mx-1"></div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
        className="p-2 hover:bg-gray-100"
        title="Reset Zoom"
        type="button"
      >
        <RotateLeft className="h-5 w-5 text-gray-600" />
      </button>
      
      {onFitToScreen && (
        <>
          <div className="h-px bg-gray-200 mx-1"></div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onFitToScreen();
            }}
            className="p-2 hover:bg-gray-100 rounded-b-lg"
            title="Fit to Screen"
            type="button"
          >
            <Maximize2 className="h-5 w-5 text-gray-600" />
          </button>
        </>
      )}
    </div>
  );
}