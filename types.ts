
export interface TileData {
  id: number;
  originalUrl: string;
  enhancedUrl?: string;
  isEnhancing: boolean;
  aspectRatio?: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export const ASPECT_RATIOS: AspectRatio[] = [
  '1:1', '3:4', '4:3', '9:16', '16:9', '21:9'
];
