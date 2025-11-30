import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FallingHearts } from '../components/Decoration';
import CameraPipeline from '../pipeline/cameraPipeline';
import { filterOptions, applyFilter } from '../filters/main';
import './CameraFilter.css'; // Add this import for custom fonts

function CameraFilter({ sessionData = {}, updateSession }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(sessionData.cameraFilter || 'smoothSkin');
  const [brightness, setBrightness] = useState(sessionData.brightness || 100);
  const [pipelineError, setPipelineError] = useState(null);
  const [pipelineReady, setPipelineReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pipelineRef = useRef(null);
  const previewCanvasRefs = useRef({});
  const previewRafId = useRef(null);
  const tempCanvasRef = useRef(null);
  const filterCanvasRefs = useRef({});

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const pipeline = new CameraPipeline({
      videoEl: videoRef.current,
      outputCanvas: canvasRef.current,
      defaultFilter: sessionData.cameraFilter || filter,
      enableFaceDetection: false, // preview only needs filters
      adjustments: { brightness: (sessionData.brightness || brightness) / 100 },
    });

    pipelineRef.current = pipeline;

    pipeline
      .start()
      .then(() => {
        setPipelineReady(true);
        setPipelineError(null);
      })
      .catch((error) => {
        console.error('Failed to start camera pipeline', error);
        setPipelineError(error?.message || 'Unable to start camera preview');
      });

    return () => {
      pipeline.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pipelineRef.current?.setFilter(filter);
  }, [filter]);

  useEffect(() => {
    pipelineRef.current?.setAdjustments({ brightness: brightness / 100 });
  }, [brightness]);

  // Create temporary canvas for filter preview processing
  useEffect(() => {
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  // Update filter preview thumbnails (throttled for performance)
  useEffect(() => {
    if (!pipelineReady || !videoRef.current || !tempCanvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: false });
    
    // Performance optimizations
    tempCtx.imageSmoothingEnabled = false;

    // Throttle preview updates: update every 3 frames (~20fps instead of 60fps)
    let frameSkip = 0;
    const FRAME_SKIP = 3;
    
    // Use lower resolution for preview processing to improve performance
    const PREVIEW_PROCESS_WIDTH = 320;
    const PREVIEW_PROCESS_HEIGHT = 240;

    const updatePreviews = () => {
      if (!video.videoWidth || !video.videoHeight) {
        previewRafId.current = requestAnimationFrame(updatePreviews);
        return;
      }

      frameSkip++;
      
      // Only update previews every N frames
      if (frameSkip < FRAME_SKIP) {
        previewRafId.current = requestAnimationFrame(updatePreviews);
        return;
      }
      frameSkip = 0;

      // Use lower resolution for processing (faster)
      if (tempCanvas.width !== PREVIEW_PROCESS_WIDTH || tempCanvas.height !== PREVIEW_PROCESS_HEIGHT) {
        tempCanvas.width = PREVIEW_PROCESS_WIDTH;
        tempCanvas.height = PREVIEW_PROCESS_HEIGHT;
      }

      // Draw video frame to temp canvas with brightness adjustment (scaled down for performance)
      const filterString = `brightness(${brightness / 100})`;
      tempCtx.filter = filterString;
      tempCtx.drawImage(video, 0, 0, PREVIEW_PROCESS_WIDTH, PREVIEW_PROCESS_HEIGHT);
      tempCtx.filter = 'none';

      // Update each filter preview
      filterOptions.forEach(({ id }) => {
        const previewCanvas = previewCanvasRefs.current[id];
        if (!previewCanvas) return;

        // Get or create filter canvas for this filter (reuse for performance)
        let filterCanvas = filterCanvasRefs.current[id];
        if (!filterCanvas) {
          filterCanvas = document.createElement('canvas');
          filterCanvasRefs.current[id] = filterCanvas;
        }

        // Use same low resolution for filter processing
        if (filterCanvas.width !== PREVIEW_PROCESS_WIDTH || filterCanvas.height !== PREVIEW_PROCESS_HEIGHT) {
          filterCanvas.width = PREVIEW_PROCESS_WIDTH;
          filterCanvas.height = PREVIEW_PROCESS_HEIGHT;
        }

        const filterCtx = filterCanvas.getContext('2d', { willReadFrequently: false });
        filterCtx.imageSmoothingEnabled = false;
        filterCtx.drawImage(tempCanvas, 0, 0);

        // Apply the filter
        try {
          applyFilter(id, filterCanvas, null);
        } catch (error) {
          console.warn(`Filter ${id} preview failed`, error);
        }

        // Draw to preview canvas (scaled down)
        const previewCtx = previewCanvas.getContext('2d', { willReadFrequently: false });
        previewCtx.imageSmoothingEnabled = true; // Enable smoothing for final display
        const previewWidth = previewCanvas.width;
        const previewHeight = previewCanvas.height;
        previewCtx.clearRect(0, 0, previewWidth, previewHeight);
        previewCtx.drawImage(filterCanvas, 0, 0, previewWidth, previewHeight);
      });

      previewRafId.current = requestAnimationFrame(updatePreviews);
    };

    previewRafId.current = requestAnimationFrame(updatePreviews);

    return () => {
      if (previewRafId.current) {
        cancelAnimationFrame(previewRafId.current);
        previewRafId.current = null;
      }
      // Clean up filter canvas refs
      Object.values(filterCanvasRefs.current).forEach(canvas => {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
      });
      filterCanvasRefs.current = {};
    };
  }, [pipelineReady, brightness]);

  const apply = () => {
    updateSession({ cameraFilter: filter, brightness });
    navigate('/camera-settings');
  };

  return (
    <div style={{ background: "#f6DDD8", height: "100vh", overflow: "hidden" }} className="w-screen h-screen flex items-center justify-center overflow-hidden bg-pink-50">
      <FallingHearts />
      <div className="max-w-6xl w-full h-full bg-white rounded-3xl p-6 border-4 border-rose-200 flex flex-col"
        style={{
          height: "90%",
          background: "#f7f4E8",
          border: "5px solid #FF6B6A",
          padding: 0,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <h2 className=" font-extrabold text-center mb-2 pt-2" style={{ fontFamily: "'Quicksand', sans-serif", color: '#6B2D9B', fontSize: 40 }}>Camera Color Effects</h2>

        <div className="flex-1 flex gap-4 overflow-hidden px-6">
          {/* Brightness Slider - Left Side */}
          <div className="flex flex-col items-center gap-3 py-4">
            {/* <h3 className="font-semibold text-sm writing-mode-vertical ">Brightness</h3> */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>{brightness}%</span>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(e.target.value)}
                className="brightness-slider"
                style={{
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical',
                  width: '12px',
                  height: '300px',
                  background: '#fff',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                  // margin: '2px'
                }}
              />
            </div>
          </div>

          {/* Preview Section - Middle */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <h3 className="font-semibold text-sm mb-1">Preview</h3> */}
            <div
              className="rounded-lg overflow-hidden flex-1 flex items-center justify-center relative bg-gray-900"
              style={{ backgroundColor: '#0f0f0f' }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ maxWidth: '80%', maxHeight: '100%' }}
              />
              <video ref={videoRef} className="hidden" />
              {!pipelineReady && !pipelineError && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  Initializing camera...
                </div>
              )}
              {pipelineError && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-white text-xs px-4">
                  {pipelineError}
                </div>
              )}
            </div>

            {/* Buttons centered below preview */}
            <div className="flex justify-center gap-3 mt-4 pb-2">
              <button onClick={() => navigate('/grid')} className="px-6 py-1 rounded-lg border-2 text-sm hover:bg-gray-100" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}>Back</button>
              <button onClick={() => navigate('/camera-settings')} className="px-6 py-1 rounded-lg border-2 text-sm hover:bg-gray-100" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}>Skip</button>
              <button onClick={apply} className="px-6 py-1 rounded-lg bg-[#FF6B6A] font-bold text-sm hover:bg-rose-600" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Apply</button>
            </div>
          </div>

          {/* Filters Section - Right Side */}
          <div className="w-64 flex flex-col gap-3">
            <h3 className="font-extrabold text-lg text-center" style={{ fontFamily: "'Quicksand', sans-serif" }}>Filters</h3>
            <div className="flex flex-col gap-3 overflow-x-auto">
              {filterOptions.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`flex-shrink-0 p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    filter === id ? 'border-rose-500 bg-rose-100' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <div className="w-full h-16 rounded-lg mb-2 overflow-hidden relative bg-gray-900">
                    <canvas
                      ref={(el) => {
                        if (el) {
                          previewCanvasRefs.current[id] = el;
                          // Set canvas size for preview (small thumbnail)
                          el.width = 200;
                          el.height = 120;
                        }
                      }}
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                    />
                    {!pipelineReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraFilter;