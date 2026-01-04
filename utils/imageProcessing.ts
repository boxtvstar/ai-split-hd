
import { TileData } from '../types';

export const splitImageIntoGrid = (
  imageUrl: string,
  rows: number,
  cols: number
): Promise<TileData[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tiles: TileData[] = [];
      const tileWidth = img.width / cols;
      const tileHeight = img.height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = tileWidth;
          canvas.height = tileHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(
              img,
              c * tileWidth,
              r * tileHeight,
              tileWidth,
              tileHeight,
              0,
              0,
              tileWidth,
              tileHeight
            );
            
            tiles.push({
              id: r * cols + c + 1,
              originalUrl: canvas.toDataURL('image/png'),
              isEnhancing: false
            });
          }
        }
      }
      resolve(tiles);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

export const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
