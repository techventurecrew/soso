/**
 * CameraSettings Component
 * 
 * Camera adjustment and photo capture screen where users can:
 * - Adjust brightness, contrast, saturation, and sharpness via sliders
 * - Preview adjustments in real-time on camera feed
 * - Capture multiple photos for grid layouts (one per cell)
 * - Enable auto-capture with face detection
 * - View and edit captured photos as thumbnails (delete to recapture)
 * 
 * Features:
 * - Real-time image adjustment preview
 * - Progress tracking for multi-photo grids
 * - Auto-capture with face detection
 * - Editable photo thumbnails gallery with delete functionality
 * - Camera settings persistence
 * 
 * @param {Function} updateSession - Callback to update session data
 * @param {Object} sessionData - Current session data including selected grid
 * @returns {JSX.Element} Camera settings and capture interface
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FallingHearts } from '../components/Decoration';
import { createGridComposite } from '../utils/imageComposite';
import CameraPipeline from '../pipeline/cameraPipeline';

function CameraSettings({ updateSession, sessionData }) {
  const navigate = useNavigate();

  // Image adjustment states: Real-time adjustment values
  const savedCameraSettings = sessionData?.cameraSettings || {};
  const [brightness, setBrightness] = useState(savedCameraSettings.brightness ?? 1); // Brightness multiplier (0.5-2)
  const [contrast, setContrast] = useState(savedCameraSettings.contrast ?? 1); // Contrast multiplier (0.5-2)
  const [saturation, setSaturation] = useState(savedCameraSettings.saturation ?? 1); // Color saturation (0-2)
  const [sharpness, setSharpness] = useState(savedCameraSettings.sharpness ?? 0); // Sharpness level (0-5)
  const [autoCapture, setAutoCapture] = useState(savedCameraSettings.autoCapture ?? false); // Auto-capture toggle
  const [capturedPhotos, setCapturedPhotos] = useState([]); // Array of captured photo data URLs
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // Current photo index for grid layouts
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState(null); // Track hovered photo for delete button
  const videoRef = useRef(null); // Video element for camera pipeline
  const previewCanvasRef = useRef(null); // Canvas displaying filtered output
  const pipelineRef = useRef(null);
  const pipelineBootedRef = useRef(false);
  const [pipelineReady, setPipelineReady] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);
  const cameraFilterName = sessionData?.cameraFilter || 'smoothSkin';
  const sessionBrightnessMultiplier = useMemo(
    () => (sessionData?.brightness || 100) / 100,
    [sessionData?.brightness]
  );

  /**
   * Calculate total number of cells needed based on selected grid layout
   * Handles both old format (string ID) and new format (object with cols/rows)
   * 
   * @returns {number} Total number of photos to capture
   */
  // Get total cells needed based on grid
  const getGridCellCount = () => {
    const grid = sessionData?.selectedGrid;
    // Handle both old format (string) and new format (object)
    if (!grid) return 1;
    
    // Strip-grid needs 4 photos (1 column × 4 rows, will be duplicated in composite)
    if (typeof grid === 'string') {
      if (grid === 'strip-grid') return 4;
    } else if (grid.id === 'strip-grid' || grid.isStripGrid) {
      return 4;
    }
    
    if (typeof grid === 'string') {
      // Old format: string ID
      if (grid === '4x6-single') return 1;
      if (grid === '4x6-2cut') return 2;
      if (grid === '4x6-4cut') return 4;
      if (grid === '4x6-6cut') return 6;
      // Legacy IDs for backward compatibility
      if (grid === '2x4-vertical-2') return 2;
      if (grid === '5x7-6cut') return 6;
      return 1;
    }
    // New format: object with cols and rows
    if (grid.cols && grid.rows) {
      return grid.cols * grid.rows;
    }
    // Fallback: try to get from ID
    if (grid.id === '4x6-single') return 1;
    if (grid.id === '4x6-2cut') return 2;
    if (grid.id === '4x6-4cut') return 4;
    if (grid.id === '4x6-6cut') return 6;
    // Legacy IDs for backward compatibility
    if (grid.id === '2x4-vertical-2') return 2;
    if (grid.id === '5x7-6cut') return 6;
    return 1;
  };

  const totalCells = getGridCellCount();
  const isComplete = capturedPhotos.length === totalCells;

  // Debug: log grid info when component mounts or grid changes
  useEffect(() => {
    console.log('CameraSettings - Grid info:', {
      selectedGrid: sessionData?.selectedGrid,
      totalCells,
      capturedPhotos: capturedPhotos.length,
      gridType: typeof sessionData?.selectedGrid
    });
  }, [sessionData?.selectedGrid, totalCells]);

  const initialFilterRef = useRef(cameraFilterName);

  useEffect(() => {
    if (pipelineBootedRef.current) return;
    if (!videoRef.current || !previewCanvasRef.current) return;

    pipelineBootedRef.current = true;

    const pipeline = new CameraPipeline({
      videoEl: videoRef.current,
      outputCanvas: previewCanvasRef.current,
      defaultFilter: initialFilterRef.current,
      enableFaceDetection: true,
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
        setPipelineError(error?.message || 'Unable to access camera');
      });

    return () => {
      pipeline.stop();
    };
  }, []);

  useEffect(() => {
    if (!pipelineRef.current) return;
    pipelineRef.current.setFilter(cameraFilterName);
  }, [cameraFilterName]);

  useEffect(() => {
    if (!pipelineRef.current) return;
    pipelineRef.current.setAdjustments({
      brightness: sessionBrightnessMultiplier * parseFloat(brightness),
      contrast: parseFloat(contrast),
      saturation: parseFloat(saturation),
      sharpness: parseFloat(sharpness),
    });
  }, [brightness, contrast, saturation, sharpness, sessionBrightnessMultiplier]);

  const apply = () => {
    updateSession({ cameraSettings: { brightness: parseFloat(brightness), contrast: parseFloat(contrast), saturation: parseFloat(saturation), sharpness: parseFloat(sharpness), autoCapture } });
    navigate('/camera-filter');
  };

  const finalizeCaptureSession = async (photos) => {
    const grid = sessionData?.selectedGrid || { cols: 1, rows: 1, id: '4x6-single' };
    const finalPhotos = [...photos];
    let compositeImage = null;

    if (finalPhotos.length === 1) {
      compositeImage = finalPhotos[0];
    } else {
      try {
        compositeImage = await createGridComposite(finalPhotos, grid, 300, 0);
        console.log('Composite image created successfully (CameraSettings)');
      } catch (error) {
        console.error('Error creating composite in CameraSettings:', error);
      }
    }

    updateSession({
      capturedPhotos: finalPhotos,
      editedPhotos: finalPhotos,
      compositeImage: compositeImage || finalPhotos[0],
      selectedGrid: grid
    });
    navigate('/frame-selection');
  };

  const handleCapture = async () => {
    const settings = {
      brightness: parseFloat(brightness),
      contrast: parseFloat(contrast),
      saturation: parseFloat(saturation),
      sharpness: parseFloat(sharpness),
      autoCapture
    };
    updateSession({ cameraSettings: settings });

    const pipeline = pipelineRef.current;
    if (!pipeline) {
      console.warn('Camera pipeline not ready');
      return;
    }

    const photoData = pipeline.capturePhoto({ quality: 0.95 });
    if (!photoData) {
      console.error('Failed to capture photo from pipeline');
      return;
    }

    const newPhotos = [...capturedPhotos, photoData];
    setCapturedPhotos(newPhotos);

    const nextIndex = newPhotos.length;
    setCurrentPhotoIndex(nextIndex);

    if (newPhotos.length === totalCells) {
      updateSession({ capturedPhotos: newPhotos });
      setTimeout(() => {
        finalizeCaptureSession(newPhotos);
      }, 500);
    }
  };

  /**
   * Delete a specific captured photo by index
   * @param {number} index - Index of photo to delete
   */
  const handleDeletePhoto = (index) => {
    const updatedPhotos = capturedPhotos.filter((_, i) => i !== index);
    setCapturedPhotos(updatedPhotos);
    setCurrentPhotoIndex(updatedPhotos.length);
    setHoveredPhotoIndex(null);
  };

  return (
    <div style={{ background: "#f6DDD8", height: "100vh", overflow: "hidden" }} className="w-screen h-screen flex items-center justify-center overflow-hidden">
      <FallingHearts />
      <div
        style={{
          height: "100%",
          background: "#f7f4E8",
          border: "5px solid #FF6B6A",
          padding: 0,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
        className="max-w-4xl w-full h-full bg-white rounded-2xl border-4 border-rose-200 flex flex-col">
        <h2 className="text-2xl py-2 font-bold mb-2 text-center" style={{ fontFamily: "'Quicksand', sans-serif", color: '#6B2D9B', fontSize: 36 }}>
          Camera Settings - Photo {capturedPhotos.length + 1} of {totalCells}
          {capturedPhotos.length === totalCells && <span className="text-green-600 ml-2">✓ Complete!</span>}
        </h2>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-rose-500 h-2 rounded-full transition-all"
            style={{ width: `${(capturedPhotos.length / totalCells) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden mx-4">
          <div className="overflow-y-auto pr-2">
            {/* Show captured photos thumbnails - Now editable */}
            {capturedPhotos.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold text-sm mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Captured ({capturedPhotos.length}/{totalCells})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {capturedPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-rose-300 rounded-lg overflow-hidden relative group cursor-pointer"
                      onMouseEnter={() => setHoveredPhotoIndex(idx)}
                      onMouseLeave={() => setHoveredPhotoIndex(null)}
                    >
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-auto" />

                      {/* Photo number badge */}
                      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="absolute top-1 left-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {idx + 1}
                      </div>

                      {/* Delete button - appears on hover */}
                      {hoveredPhotoIndex === idx && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <button
                            onClick={() => handleDeletePhoto(idx)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-md text-center mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Preview</h3>
            <div className="bg-gray-900 rounded-lg overflow-hidden p-1 flex-1 flex items-center justify-center relative">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
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
            <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Canvas filters are applied live and will match your captured photos.</p>

            {/* Capture status message */}
            {!isComplete && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {totalCells > 1 ? (
                  <>📸 Capture {totalCells - capturedPhotos.length} more photo{totalCells - capturedPhotos.length !== 1 ? 's' : ''} to complete the grid</>
                ) : (
                  <>📸 Capture your photo</>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button onClick={() => {
            if (capturedPhotos.length > 0) {
              const updatedPhotos = capturedPhotos.slice(0, -1);
              setCapturedPhotos(updatedPhotos);
              setCurrentPhotoIndex(updatedPhotos.length);
            } else {
              navigate('/camera-filter');
            }
          }} className="px-3 rounded-lg border-2 text-sm m-2 hover:bg-gray-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {capturedPhotos.length > 0 ? 'Remove Last' : 'Back'}
          </button>
          <div className="flex gap-2 m-2">
            {!isComplete && (
              <button onClick={apply} className="px-3 py-1 rounded-lg bg-rose-300 font-bold text-xs hover:bg-rose-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Skip Capture</button>
            )}
            <button
              onClick={handleCapture}
              disabled={isComplete || !pipelineReady}
              className={`px-4 py-2 rounded-lg font-bold text-white text-sm ${
                isComplete || !pipelineReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 shadow-lg'
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {isComplete ? 'Complete ✓' : !pipelineReady ? 'Starting camera…' : `📸 Capture Photo ${capturedPhotos.length + 1}/${totalCells}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraSettings;