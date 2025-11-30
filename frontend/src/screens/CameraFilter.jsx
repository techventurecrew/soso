import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FallingHearts } from '../components/Decoration';
import CameraPipeline from '../pipeline/cameraPipeline';
import { filterOptions } from '../filters/main';
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
                  <div className="w-full h-16 bg-gray-900 rounded-lg mb-2 flex items-center justify-center text-white text-xs">
                    Live preview
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