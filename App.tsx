
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Grid, Sliders, CheckCircle2, Download, Sparkles, Loader2, Archive, Maximize2 } from 'lucide-react';
import JSZip from 'jszip';
import { TileData, AspectRatio, ASPECT_RATIOS } from './types';
import { splitImageIntoGrid, downloadImage } from './utils/imageProcessing';
import { enhanceImage } from './services/geminiService';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [activeRatio, setActiveRatio] = useState<AspectRatio>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setTiles([]); // Reset tiles on new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSplit = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    try {
      const result = await splitImageIntoGrid(sourceImage, rows, cols);
      setTiles(result);
    } catch (err) {
      console.error("Splitting error:", err);
      alert("이미지 분할에 실패했습니다. 다른 이미지를 시도해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhance = async (tileId: number) => {
    const targetTile = tiles.find(t => t.id === tileId);
    if (!targetTile || targetTile.isEnhancing) return;

    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, isEnhancing: true } : t
    ));

    try {
      const enhanced = await enhanceImage(targetTile.originalUrl);
      setTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, enhancedUrl: enhanced, isEnhancing: false } : t
      ));
    } catch (err) {
      console.error("Enhancement error:", err);
      alert("AI 화질 개선에 실패했습니다. 연결 상태를 확인해 주세요.");
      setTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, isEnhancing: false } : t
      ));
    }
  };

  const handleDownloadAll = async () => {
    if (tiles.length === 0) return;
    setIsZipping(true);
    
    try {
      const zip = new JSZip();
      
      for (const tile of tiles) {
        const url = tile.enhancedUrl || tile.originalUrl;
        const base64Data = url.split(',')[1];
        const fileName = `tile-${tile.id}-${tile.enhancedUrl ? 'hd' : 'orig'}.png`;
        zip.file(fileName, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `split-images-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Zipping error:", err);
      alert("압축 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setIsZipping(false);
    }
  };

  const reset = () => {
    setSourceImage(null);
    setTiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="pt-12 pb-8 text-center px-4">
        <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
          제작: 디스이즈머니
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          AI 이미지 분할기 <span className="text-blue-600">& 화질 개선</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          한 장의 이미지를 원하는 격자로 분할하고, Gemini AI를 통해 텍스트와 워터마크를 제거한 깨끗한 HD 화질로 업그레이드하세요.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          이미지 분석 및 복원을 위해 최신 Gemini 2.5 기술이 적용되었습니다.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Source & Grid Config */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div 
                className={`relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${sourceImage ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => !sourceImage && fileInputRef.current?.click()}
              >
                {sourceImage ? (
                  <div className="relative group w-full h-full">
                    <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg transition-all"
                      >
                        이미지 변경
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-100 rounded-full mb-4">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">클릭하여 업로드하거나 이미지를 드래그하세요</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG 또는 WebP (최대 10MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>

              {sourceImage && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">가로 분할 (열)</label>
                      <input 
                        type="number" 
                        value={cols} 
                        onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <X className="w-4 h-4 text-gray-400 mt-6" />
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">세로 분할 (행)</label>
                      <input 
                        type="number" 
                        value={rows} 
                        onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleSplit}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Grid className="w-5 h-5" />}
                      이미지 분할하기
                    </button>
                    <button 
                      onClick={reset}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-6 rounded-xl transition-all border border-red-100 flex items-center justify-center"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results & Tiles */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    이미지 목록
                  </h2>
                </div>
                
                <div className="flex flex-col gap-4">
                  {/* Aspect Ratio Row */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap">표시 비율:</span>
                    <div className="flex gap-1">
                      {ASPECT_RATIOS.map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => setActiveRatio(ratio)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${activeRatio === ratio ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download Row */}
                  {tiles.length > 0 && (
                    <div className="flex">
                      <button
                        onClick={handleDownloadAll}
                        disabled={isZipping}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md disabled:opacity-50 w-full sm:w-auto"
                      >
                        {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                        전체 결과물 다운로드 (ZIP 압축)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {tiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 border-2 border-dotted border-gray-200 rounded-xl">
                  <Grid className="w-12 h-12 mb-4 opacity-20" />
                  <p>분할된 이미지들이 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tiles.map((tile) => (
                    <TileCard 
                      key={tile.id} 
                      tile={tile} 
                      onEnhance={() => handleEnhance(tile.id)}
                      onView={() => setPreviewImage(tile.enhancedUrl || tile.originalUrl)}
                      aspectRatio={activeRatio}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      <footer className="mt-20 border-t border-gray-200 py-10 text-center">
        <p className="text-gray-400 text-sm">© 2024 AI Image Splitter - 제작: <span className="font-bold text-gray-600">디스이즈머니</span></p>
      </footer>
    </div>
  );
};

interface TileCardProps {
  tile: TileData;
  onEnhance: () => void;
  onView: () => void;
  aspectRatio: string;
}

const TileCard: React.FC<TileCardProps> = ({ tile, onEnhance, onView, aspectRatio }) => {
  const [arWidth, arHeight] = aspectRatio.split(':').map(Number);
  const ratioStyles = {
    paddingTop: `${(arHeight / arWidth) * 100}%`
  };

  const handleDownload = () => {
    const url = tile.enhancedUrl || tile.originalUrl;
    downloadImage(url, `tile-${tile.id}-${tile.enhancedUrl ? 'hd' : 'orig'}.png`);
  };

  return (
    <div className="flex flex-col gap-3 group">
      <div 
        className="relative w-full overflow-hidden rounded-xl bg-gray-100 border border-gray-200 transition-all group-hover:shadow-md cursor-zoom-in"
        style={ratioStyles}
        onClick={onView}
      >
        <img 
          src={tile.enhancedUrl || tile.originalUrl} 
          alt={`Tile ${tile.id}`} 
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all drop-shadow-md" />
        </div>

        {tile.enhancedUrl && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
        {tile.isEnhancing && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">AI 화질 개선 중...</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">타일 {tile.id} <span className="text-xs font-normal text-gray-400">({tile.enhancedUrl ? 'HD 개선됨' : '원본'})</span></span>
        </div>
        
        <button 
          onClick={onEnhance}
          disabled={tile.isEnhancing || !!tile.enhancedUrl}
          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${tile.enhancedUrl ? 'bg-green-50 text-green-600 border-green-100 cursor-default' : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white border-transparent'}`}
        >
          {tile.enhancedUrl ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              텍스트 제거 및 HD 개선 완료
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              AI HD 화질 개선 (텍스트 제거)
            </>
          )}
        </button>

        <button 
          onClick={handleDownload}
          className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        >
          <Download className="w-3.5 h-3.5" />
          다운로드
        </button>
      </div>
    </div>
  );
};

export default App;
