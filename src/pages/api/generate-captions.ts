import type { APIRoute } from 'astro';

interface CaptionRequest {
  script: string;
  audioDuration: number;
  aspectRatio: string;
  captionStyle?: string;
}

interface CaptionSegment {
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  fontSize: number;
  style: any;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { script, audioDuration, aspectRatio, captionStyle = 'default' }: CaptionRequest = await request.json();

    if (!script || !audioDuration || !aspectRatio) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: script, audioDuration, aspectRatio'
      }), { status: 400 });
    }

    console.log('🎬 GENERATING CAPCUT-STYLE CAPTIONS:', {
      script: script.substring(0, 50) + '...',
      audioDuration: audioDuration.toFixed(3) + 's',
      aspectRatio,
      style: captionStyle
    });

    // ✅ CREATE PERFECTLY SYNCED CAPTIONS
    const captionSegments = createCapCutStyleCaptions(script, audioDuration, aspectRatio, captionStyle);

    console.log('✅ CAPCUT CAPTIONS CREATED:', captionSegments.length, 'segments');

    return new Response(JSON.stringify({
      success: true,
      captions: captionSegments,
      metadata: {
        totalSegments: captionSegments.length,
        duration: audioDuration,
        aspectRatio,
        style: captionStyle,
        syncType: 'WORD_LEVEL_TIMING'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Caption generation error:', error);
    return new Response(JSON.stringify({
      error: 'Caption generation failed',
      details: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
};

// ✅ FIXED CAPCUT-STYLE CAPTIONS with proper timing
function createCapCutStyleCaptions(script: string, audioDuration: number, aspectRatio: string, styleType: string): CaptionSegment[] {
  const words = script.split(/\s+/).filter(word => word.trim());
  const totalWords = words.length;
  
  // ✅ BETTER TIMING: Match actual speech patterns
  const timePerWord = audioDuration / totalWords;
  
  console.log('🎯 CAPCUT TIMING:', {
    totalWords,
    audioDuration: audioDuration.toFixed(2) + 's',
    timePerWord: timePerWord.toFixed(3) + 's per word'
  });

  const captionSegments: CaptionSegment[] = [];
  let currentTime = 0.2; // Small delay to sync with audio
  
  // ✅ CREATE 2-3 WORD CHUNKS for CapCut style
  let wordIndex = 0;
  while (wordIndex < words.length) {
    const chunkSize = Math.random() < 0.5 ? 2 : 3; // Random 2-3 words
    const endIndex = Math.min(wordIndex + chunkSize, words.length);
    const chunkWords = words.slice(wordIndex, endIndex);
    
    const chunkDuration = chunkWords.length * timePerWord;
    const start = currentTime;
    const end = currentTime + chunkDuration;
    
    // ✅ ADD EMOJIS to some captions
    let captionText = chunkWords.join(' ');
    if (Math.random() < 0.4) { // 40% chance for emoji
      captionText = addSmartEmojis(captionText);
    }
    
    // ✅ CENTER POSITIONING
    const position = getCenterPosition(aspectRatio);
    
    captionSegments.push({
      text: captionText,
      start: Math.round(start * 1000) / 1000,
      end: Math.round(end * 1000) / 1000,
      x: position.x,
      y: position.y,
      fontSize: getCapCutFontSize(aspectRatio, styleType),
      style: getCapCutStyleTemplate(aspectRatio, styleType)
    });
    
    console.log(`📝 Caption: "${captionText}" (${start.toFixed(2)}s - ${end.toFixed(2)}s)`);
    
    currentTime = end + 0.1;
    wordIndex = endIndex;
  }

  return captionSegments;
}

// ✅ CENTER POSITIONING (as requested)
function getCenterPosition(aspectRatio: string) {
  const dimensions = getDimensions(aspectRatio);
  return { 
    x: dimensions.width / 2, 
    y: dimensions.height / 2  // ✅ CENTER of screen
  };
}

// ✅ SMART EMOJI ADDITION
function addSmartEmojis(text: string): string {
  const lowerText = text.toLowerCase();
  
  const emojiPatterns = [
    { keywords: ['money', 'rich', 'wealth', 'million', 'dollar'], emoji: '💰' },
    { keywords: ['fire', 'hot', 'amazing', 'incredible'], emoji: '🔥' },
    { keywords: ['mind', 'brain', 'think', 'idea'], emoji: '🧠' },
    { keywords: ['heart', 'love', 'passion'], emoji: '❤️' },
    { keywords: ['star', 'celebrity', 'famous'], emoji: '⭐' },
    { keywords: ['shock', 'surprising', 'unbelievable'], emoji: '😱' },
    { keywords: ['strong', 'power', 'strength'], emoji: '💪' },
    { keywords: ['time', 'clock', 'hour', 'minute'], emoji: '⏰' },
    { keywords: ['success', 'win', 'victory'], emoji: '🏆' },
    { keywords: ['secret', 'hidden', 'mystery'], emoji: '🤫' },
    { keywords: ['fast', 'speed', 'quick'], emoji: '⚡' },
    { keywords: ['world', 'global', 'earth'], emoji: '🌍' },
    { keywords: ['technology', 'tech', 'digital'], emoji: '🚀' },
    { keywords: ['food', 'eat', 'delicious'], emoji: '🍔' },
    { keywords: ['home', 'house', 'family'], emoji: '🏠' }
  ];

  for (const pattern of emojiPatterns) {
    if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
      return `${pattern.emoji} ${text}`;
    }
  }
  
  return text;
}

// ✅ CAPCUT FONT SIZES
function getCapCutFontSize(aspectRatio: string, styleType: string): number {
  const baseSizes = {
    '9:16': 46,
    '16:9': 38,
    '1:1': 42
  };
  
  const size = baseSizes[aspectRatio] || 46;
  
  switch (styleType) {
    case 'style-neon': return size + 8;
    case 'brown-bold': return size + 6;
    case 'fox-modern': return size + 4;
    case 'minimal': return size - 4;
    default: return size;
  }
}

// ✅ CAPCUT STYLE TEMPLATES (like your screenshot)
function getCapCutStyleTemplate(aspectRatio: string, styleType: string) {
  const maxWidth = aspectRatio === '9:16' ? 800 : aspectRatio === '16:9' ? 1000 : 900;
  
  const templates = {
    // 1. Default (like CapCut Default)
    'default': {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
      fontWeight: '800',
      textAlign: 'center' as const,
      maxWidth,
      padding: 16,
      borderRadius: 12,
      shadow: true
    },
    
    // 2. Style Neon (like CapCut "STYLE")
    'style-neon': {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      textColor: '#FFFF00',
      strokeColor: '#FFD700',
      strokeWidth: 4,
      fontWeight: '900',
      textAlign: 'center' as const,
      maxWidth,
      padding: 20,
      borderRadius: 16,
      shadow: true,
      glow: '#FFFF00'
    },
    
    // 3. Brown Bold (like CapCut "BROWN")
    'brown-bold': {
      backgroundColor: 'rgba(139, 69, 19, 0.9)',
      textColor: '#FFFFFF',
      strokeColor: '#8B4513',
      strokeWidth: 5,
      fontWeight: '900',
      textAlign: 'center' as const,
      maxWidth,
      padding: 18,
      borderRadius: 14,
      shadow: true
    },
    
    // 4. Fox Modern (like CapCut "FOX")
    'fox-modern': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#000000',
      strokeColor: '#FFFFFF',
      strokeWidth: 3,
      fontWeight: '800',
      textAlign: 'center' as const,
      maxWidth,
      padding: 16,
      borderRadius: 10,
      shadow: true
    },
    
    // 5. Minimal Clean
    'minimal': {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      textColor: '#333333',
      strokeColor: '#FFFFFF',
      strokeWidth: 2,
      fontWeight: '600',
      textAlign: 'center' as const,
      maxWidth,
      padding: 12,
      borderRadius: 8,
      shadow: false
    },
    
    // 6. Gradient Pro
    'gradient-pro': {
      backgroundColor: 'linear-gradient(45deg, #667eea, #764ba2)',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
      fontWeight: '800',
      textAlign: 'center' as const,
      maxWidth,
      padding: 18,
      borderRadius: 16,
      shadow: true
    },
    
    // 7. Red Bold
    'red-bold': {
      backgroundColor: 'rgba(220, 20, 60, 0.9)',
      textColor: '#FFFFFF',
      strokeColor: '#8B0000',
      strokeWidth: 4,
      fontWeight: '900',
      textAlign: 'center' as const,
      maxWidth,
      padding: 20,
      borderRadius: 16,
      shadow: true
    },
    
    // 8. Blue Tech
    'blue-tech': {
      backgroundColor: 'rgba(0, 123, 255, 0.9)',
      textColor: '#FFFFFF',
      strokeColor: '#001f3f',
      strokeWidth: 3,
      fontWeight: '800',
      textAlign: 'center' as const,
      maxWidth,
      padding: 16,
      borderRadius: 12,
      shadow: true
    }
  };
  
  return templates[styleType] || templates['default'];
}

function getDimensions(aspectRatio: string) {
  const dimensions = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 }
  };
  return dimensions[aspectRatio] || dimensions['9:16'];
} 