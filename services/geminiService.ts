
import { GoogleGenAI } from "@google/genai";

export const enhanceImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Clean base64 string
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png',
            },
          },
          {
            text: '이 이미지 타일의 화질을 HD급으로 개선해 주세요. 더 선명하게 만들고, 압축 아티팩트를 제거하며, 선명도와 조명을 개선하세요. 중요: 이미지에 있는 모든 텍스트, 라벨, 또는 워터마크를 완벽하게 제거하고 순수하게 사진 이미지(피사체와 배경)만 남겨주세요. 개선된 이미지만 반환하세요.',
          },
        ],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("AI로부터 응답이 없습니다.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("AI 응답에서 이미지 데이터를 찾을 수 없습니다.");
  } catch (error) {
    console.error("Gemini enhancement failed:", error);
    throw error;
  }
};
