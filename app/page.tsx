"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, Printer, Plus, Minus, Trash2, Settings, Image as ImageIcon, Info, AlertTriangle, ExternalLink } from 'lucide-react';

type PaperSize = { name: string; width: number; height: number };
type PhotoSize = { name: string; width: number; height: number };
type UploadedImage = { id: string; url: string; width: number; height: number; copies: number };

const PAPER_SIZES: PaperSize[] = [
  { name: 'A4', width: 210, height: 297 },
  { name: 'Letter', width: 215.9, height: 279.4 },
  { name: 'A3', width: 297, height: 420 },
  { name: 'Legal', width: 215.9, height: 355.6 },
];

const PHOTO_SIZES: PhotoSize[] = [
  { name: '4x6 in', width: 101.6, height: 152.4 },
  { name: '5x7 in', width: 127, height: 177.8 },
  { name: '2x3 in (Wallet)', width: 50.8, height: 76.2 },
  { name: '3.5x5 in', width: 88.9, height: 127 },
  { name: 'Polaroid (3.5x4.2 in)', width: 88.9, height: 106.6 },
  { name: 'Passport (2x2 in)', width: 50.8, height: 50.8 },
];

export default function PrintApp() {
  const [selectedPaper, setSelectedPaper] = useState<PaperSize>(PAPER_SIZES[0]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSize>(PHOTO_SIZES[0]);
  const [borderWidth, setBorderWidth] = useState<number>(4); // mm
  const [pageMargin, setPageMargin] = useState<number>(10); // mm
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsInIframe(window !== window.parent);
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages(prev => [...prev, { id: Math.random().toString(), url, width: img.width, height: img.height, copies: 1 }]);
      };
      img.src = url;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateCopies = (id: string, delta: number) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        const newCopies = Math.max(1, img.copies + delta);
        return { ...img, copies: newCopies };
      }
      return img;
    }));
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const layout = useMemo(() => {
    const AW = selectedPaper.width - 2 * pageMargin;
    const AH = selectedPaper.height - 2 * pageMargin;

    const pw = selectedPhoto.width;
    const ph = selectedPhoto.height;

    // Option A: Standard orientation
    const colsA = Math.floor(AW / pw);
    const rowsA = Math.floor(AH / ph);
    const countA = colsA * rowsA;

    // Option B: Rotated grid (swapping width and height of the photo cell)
    const colsB = Math.floor(AW / ph);
    const rowsB = Math.floor(AH / pw);
    const countB = colsB * rowsB;

    let cellW, cellH, cols, rows, isRotated;
    // Automatically pick the orientation that fits the most photos
    if (countB > countA) {
      cellW = ph;
      cellH = pw;
      cols = colsB;
      rows = rowsB;
      isRotated = true;
    } else {
      cellW = pw;
      cellH = ph;
      cols = colsA;
      rows = rowsA;
      isRotated = false;
    }

    const photosPerPage = cols * rows;
    if (photosPerPage === 0) return { pages: [], cellW, cellH, cols, rows, offsetX: 0, offsetY: 0, isRotated, error: 'Photo size is too large for this paper.' };

    const flattenedImages = images.flatMap(img => Array(img.copies).fill(img));
    const pages = [];
    for (let i = 0; i < flattenedImages.length; i += photosPerPage) {
      pages.push(flattenedImages.slice(i, i + photosPerPage));
    }

    // Calculate centering offsets
    const gridWidth = cols * cellW;
    const gridHeight = rows * cellH;
    const offsetX = (selectedPaper.width - gridWidth) / 2;
    const offsetY = (selectedPaper.height - gridHeight) / 2;

    return { pages, cellW, cellH, cols, rows, offsetX, offsetY, isRotated, error: null };
  }, [selectedPaper, selectedPhoto, pageMargin, images]);

  const handlePrint = () => {
    if (isInIframe) {
      setShowPrintWarning(true);
    }
    try {
      window.print();
    } catch (e) {
      console.error('Print failed:', e);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100 font-sans text-neutral-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-neutral-200 flex flex-col no-print shadow-sm z-10 shrink-0">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            PrintPrep
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Prepare photos for printing</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Settings */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Layout Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Paper Size</label>
                <select 
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  value={selectedPaper.name}
                  onChange={(e) => setSelectedPaper(PAPER_SIZES.find(p => p.name === e.target.value) || PAPER_SIZES[0])}
                >
                  {PAPER_SIZES.map(p => <option key={p.name} value={p.name}>{p.name} ({p.width}x{p.height}mm)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Photo Size</label>
                <select 
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  value={selectedPhoto.name}
                  onChange={(e) => setSelectedPhoto(PHOTO_SIZES.find(p => p.name === e.target.value) || PHOTO_SIZES[0])}
                >
                  {PHOTO_SIZES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 flex justify-between">
                  <span>White Border</span>
                  <span className="text-neutral-500">{borderWidth} mm</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="20" 
                  value={borderWidth} 
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Photos
            </h2>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-4 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">Upload Images</span>
            </button>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="space-y-2">
              {images.map(img => (
                <div key={img.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-neutral-200 shadow-sm">
                  <img src={img.url} alt="thumbnail" className="w-12 h-12 object-cover rounded-md border border-neutral-200" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 bg-neutral-100 w-fit rounded-md p-0.5 border border-neutral-200">
                      <button onClick={() => updateCopies(img.id, -1)} className="p-1 hover:bg-white rounded text-neutral-600 shadow-sm transition-all"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-medium w-6 text-center">{img.copies}</span>
                      <button onClick={() => updateCopies(img.id, 1)} className="p-1 hover:bg-white rounded text-neutral-600 shadow-sm transition-all"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <button onClick={() => removeImage(img.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">No photos uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-800 flex gap-2 items-start">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Print Tip:</strong> Set your printer to <strong>{selectedPaper.name}</strong>, margins to <strong>None</strong>, and scale to <strong>100% (Actual Size)</strong>.</span>
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-3">
          {showPrintWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium mb-1">Printing blocked by browser preview</p>
                <p>Please open the app in a new tab using the button in the top right corner of the screen to print.</p>
              </div>
            </div>
          )}
          <button 
            onClick={handlePrint}
            disabled={images.length === 0 || !!layout.error}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Print {layout.pages.length} Page{layout.pages.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-neutral-100 print-area-container">
        <div className="max-w-5xl mx-auto space-y-8 flex flex-col items-center pb-20">
          
          {!layout.error && layout.pages.length > 0 && (
            <div className="w-full max-w-md bg-white p-3 rounded-lg border border-neutral-200 shadow-sm text-sm text-center text-neutral-600 no-print flex items-center justify-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Fitting {layout.cols * layout.rows} photos per page {layout.isRotated ? '(Grid auto-rotated for best fit)' : ''}
            </div>
          )}

          {layout.error ? (
            <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-200 w-full text-center max-w-md mt-20">
              {layout.error}
            </div>
          ) : layout.pages.length === 0 ? (
            <div className="h-64 mt-20 flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-300 rounded-2xl w-full max-w-md bg-white">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>Upload images to see preview</p>
            </div>
          ) : (
            layout.pages.map((page, pageIndex) => (
              <div 
                key={pageIndex} 
                className="print-page bg-white shadow-xl relative overflow-hidden shrink-0"
                style={{ 
                  width: `${selectedPaper.width}mm`, 
                  height: `${selectedPaper.height}mm` 
                }}
              >
                <div 
                  className="absolute"
                  style={{
                    left: `${layout.offsetX}mm`,
                    top: `${layout.offsetY}mm`,
                    width: `${layout.cols * layout.cellW}mm`,
                    height: `${layout.rows * layout.cellH}mm`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${layout.cols}, ${layout.cellW}mm)`,
                    gridTemplateRows: `repeat(${layout.rows}, ${layout.cellH}mm)`,
                  }}
                >
                  {page.map((img, imgIndex) => {
                    // Determine if we need to rotate the image 90deg to fit better inside the cell
                    const imgIsLandscape = img.width > img.height;
                    const cellIsLandscape = layout.cellW > layout.cellH;
                    const shouldRotate = imgIsLandscape !== cellIsLandscape;

                    return (
                      <div 
                        key={imgIndex}
                        className="relative box-border flex items-center justify-center"
                        style={{
                          width: `${layout.cellW}mm`,
                          height: `${layout.cellH}mm`,
                          // The cutting guide
                          borderRight: (imgIndex % layout.cols !== layout.cols - 1) ? '1px dashed #ccc' : 'none',
                          borderBottom: (Math.floor(imgIndex / layout.cols) !== layout.rows - 1) ? '1px dashed #ccc' : 'none',
                        }}
                      >
                        {/* Outer border for the whole grid to act as cutting guides on the edges */}
                        {imgIndex % layout.cols === 0 && <div className="absolute left-0 top-0 bottom-0 border-l border-dashed border-[#ccc]" />}
                        {imgIndex % layout.cols === layout.cols - 1 && <div className="absolute right-0 top-0 bottom-0 border-r border-dashed border-[#ccc]" />}
                        {Math.floor(imgIndex / layout.cols) === 0 && <div className="absolute top-0 left-0 right-0 border-t border-dashed border-[#ccc]" />}
                        {Math.floor(imgIndex / layout.cols) === layout.rows - 1 && <div className="absolute bottom-0 left-0 right-0 border-b border-dashed border-[#ccc]" />}

                        {/* Inner container for the image, sized exactly to the photo minus the white border */}
                        <div 
                          className="bg-neutral-50"
                          style={{
                            width: `${layout.cellW - 2 * borderWidth}mm`,
                            height: `${layout.cellH - 2 * borderWidth}mm`,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          <img 
                            src={img.url} 
                            alt={`Photo ${imgIndex}`}
                            style={{
                              // If rotated, swap the width and height to perfectly fill the container after rotation
                              width: shouldRotate ? `${layout.cellH - 2 * borderWidth}mm` : '100%',
                              height: shouldRotate ? `${layout.cellW - 2 * borderWidth}mm` : '100%',
                              objectFit: 'cover',
                              transform: shouldRotate ? 'rotate(90deg)' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
