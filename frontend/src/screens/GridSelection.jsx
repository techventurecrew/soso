/**
 * GridSelection Component
 * 
 * Allows users to select their preferred photo grid layout.
 * Displays visual previews of each grid option.
 * 
 * Features:
 * - Visual grid preview cards showing layout structure
 * - Four grid options with 4x6 inch print sizes
 * - Interactive selection with visual feedback
 * - Decorative bear character with camera
 * - Scattered hearts for aesthetic
 * 
 * Grid Options:
 * - 4x6 Single: 1 photo, 1x1 grid, 4" × 6" print size
 * - 4x6 2 Cut: 2 photos, 1 column × 2 rows, 4" × 6" print size
 * - 4x6 4 Cut: 4 photos, 2 columns × 2 rows, 4" × 6" print size
 * - 4x6 6 Cut: 6 photos, 2 columns × 3 rows, 4" × 6" print size
 * 
 * @param {Function} updateSession - Callback to save selected grid to session
 * @returns {JSX.Element} Grid selection screen with visual previews
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FallingSparkles, FloatingBubbles, FallingHearts, ConfettiRain, TwinklingStars } from '../components/Decoration';


function GridSelection({ updateSession }) {
  const navigate = useNavigate();
  // Currently selected grid option ID
  const [selected, setSelected] = useState('4x6-single');

  // Available grid layouts with their properties
  // All grids use 4x6 inch print size
  const grids = [
    { id: '4x6-single', name: 'SINGLE', desc: 'Single photo', cols: 1, rows: 1, printWidth: 4, printHeight: 6 },
    { id: '4x6-2cut', name: '2 CUT', desc: '2 photos vertical', cols: 1, rows: 2, printWidth: 4, printHeight: 6 },
    { id: '4x6-4cut', name: '4 CUT', desc: '4 grid cells', cols: 2, rows: 2, printWidth: 4, printHeight: 6 },
    { id: '4x6-6cut', name: '6 CUT', desc: '6 grid cells', cols: 2, rows: 3, printWidth: 4, printHeight: 6 },
  ];

  /**
   * Handle Continue button click
   * Saves selected grid to session and navigates to camera filter screen
   */
  const handleContinue = () => {
    const gridData = grids.find(g => g.id === selected);
    updateSession({ selectedGrid: gridData });
    navigate('/camera-filter');
  };

  /**
   * Render visual grid preview based on grid dimensions
   * Creates a visual representation of the grid layout
   * All grids use 4x6 inch aspect ratio (2:3) for preview
   */
  const renderGridPreview = (grid) => {
    const cells = [];
    const totalCells = grid.cols * grid.rows;

    for (let i = 0; i < totalCells; i++) {
      cells.push(
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-400"
          style={{
            width: '100%',
            height: '100%',
            minHeight: 0,
          }}
        />
      );
    }

    return (
      <div
        className="grid gap-1 p-2"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          width: '100%',
          height: '100%',
          minHeight: '80px',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '2/3', // Overall container maintains 4x6 aspect ratio (2:3)
          minHeight: 0,
        }}
      >
        {cells}
      </div>
    );
  };

  return (
    // Main container with light pink background
    <div style={{ background: "#f6DDD8", height: "100vh", overflow: "hidden" }} className="w-screen h-screen bg-pink-50 flex items-center justify-center overflow-hidden p-6">
      <FallingHearts />

      {/* Content panel: Cream background with coral-pink border */}
      <div


        style={{
          height: "90%",
          background: "#f7f4E8", // Cream white background
          border: "5px solid #FF6B6A", // Coral-pink border
          padding: 0,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
        className="relative w-full max-w-6xl h-full bg-white rounded-2xl p-6 border-4 border-rose-200 flex flex-col">
        <FallingHearts />

        {/* Page title */}
        <h2 className="text-center" style={{ color: '#6B2D9B', fontSize: 32, fontWeight: 800 }}>
          PLEASE CHOOSE YOUR FAVOURITE GRID
        </h2>

        {/* Grid options: All 4 options displayed horizontally in one row */}
        <div className="flex gap-4 flex-1 overflow-hidden m-3 px-4"
          style={{
            height: 'calc(100% - 120px)', // Adjust height to fit within the container
            justifyContent: 'center',
            alignItems: 'stretch',
          }}>
          {grids.map((grid) => (
            <button
              key={grid.id}
              onClick={() => setSelected(grid.id)}
              className={`relative rounded-2xl border-4 p-4 transition-all flex flex-col items-center ${selected === grid.id
                ? 'shadow-lg'
                : 'hover:opacity-90'
                }`}
              style={{
                background: '#FFFFFF',
                borderColor: selected === grid.id ? '#FF69B4' : '#E5E5E5',
                borderWidth: selected === grid.id ? '4px' : '2px',
                flex: '1 1 0',
                minWidth: 0,
              }}
            >
              {/* Visual grid preview: Shows layout structure */}
              <div className="w-full flex-1 flex items-center justify-center mb-3" style={{ minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                {renderGridPreview(grid)}
              </div>

              {/* Grid name label */}
              <div
                className="font-bold text-xl"
                style={{
                  color: selected === grid.id ? '#8B0000' : '#666666',
                }}
              >
                {grid.name}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation buttons at bottom */}
        <div className="flex justify-between items-end m-3 gap-3" style={{ minHeight: '60px' }}>
          {/* Decorative bear character with camera (bottom-left) */}
          <div className="flex items-center">
            <img
              src="/images/teddy_left.png"
              alt="teddy bear with camera"
              style={{ width: 120, height: 'auto', zIndex: 1 }}
            />
          </div>

          {/* Continue button: Proceeds to next step with selected grid (bottom-right) */}
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all"
            style={{
              background: '#FF69B4',
              border: 'none',
            }}
            onMouseEnter={(e) => e.target.style.background = '#FF1493'}
            onMouseLeave={(e) => e.target.style.background = '#FF69B4'}
          >
            Continue
          </button>
        </div>

      </div>
    </div >
  );
}

export default GridSelection;
