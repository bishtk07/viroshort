import type { APIRoute } from 'astro';

interface CaptionRequest {
  script: string;
  audioDuration: number;
  aspectRatio: string;
  captionStyle?: string;
  speechMarks?: Array<{word: string, start: number, end: number}>;
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
    const { script, audioDuration, aspectRatio, captionStyle = 'default', speechMarks }: CaptionRequest = await request.json();

    if (!script || !audioDuration || !aspectRatio) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: script, audioDuration, aspectRatio'
      }), { status: 400 });
    }

    console.log('🎬 GENERATING WORD-SYNCED CAPTIONS:', {
      script: script.substring(0, 50) + '...',
      audioDuration: audioDuration.toFixed(3) + 's',
      aspectRatio,
      style: captionStyle,
      speechMarksAvailable: !!(speechMarks && speechMarks.length > 0),
      speechMarksCount: speechMarks?.length || 0
    });

    // ✅ CREATE PERFECTLY SYNCED CAPTIONS USING SPEECH MARKS
    const captionSegments = speechMarks && speechMarks.length > 0 
      ? createWordSyncedCaptions(script, speechMarks, aspectRatio, captionStyle)
      : createCapCutStyleCaptions(script, audioDuration, aspectRatio, captionStyle);

    console.log('✅ WORD-SYNCED CAPTIONS CREATED:', captionSegments.length, 'segments');

    // ✅ FINAL VERIFICATION: Ensure last caption ends exactly at audio duration
    if (captionSegments.length > 0) {
      const firstCaption = captionSegments[0];
      const lastCaption = captionSegments[captionSegments.length - 1];
      lastCaption.end = Math.min(lastCaption.end, audioDuration); // Don't exceed audio duration
      
      console.log(`🎯 WORD-SYNC VERIFICATION:`, {
        method: speechMarks && speechMarks.length > 0 ? 'SPEECH_MARKS' : 'PROPORTIONAL_DISTRIBUTION',
        firstCaption: `"${firstCaption.text}" (${firstCaption.start}s-${firstCaption.end}s)`,
        lastCaption: `"${lastCaption.text}" (${lastCaption.start}s-${lastCaption.end}s)`,
        audioDuration: audioDuration.toFixed(3) + 's',
        totalCaptions: captionSegments.length,
        coverage: `${firstCaption.start}s to ${lastCaption.end}s`
      });
    }

    return new Response(JSON.stringify({
      success: true,
      captions: captionSegments,
      metadata: {
        totalSegments: captionSegments.length,
        duration: audioDuration,
        aspectRatio,
        style: captionStyle,
        syncType: speechMarks && speechMarks.length > 0 ? 'WORD_LEVEL_TIMING' : 'PROPORTIONAL_TIMING'
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

// ✅ NEW: CREATE WORD-SYNCED CAPTIONS USING SPEECH MARKS
function createWordSyncedCaptions(script: string, speechMarks: Array<{word: string, start: number, end: number}>, aspectRatio: string, styleType: string): CaptionSegment[] {
  const words = script.split(/\s+/).filter(word => word.trim());
  
  console.log('🎯 WORD-LEVEL SYNC:', {
    totalWords: words.length,
    speechMarksCount: speechMarks.length,
    method: 'SPEECH_MARKS_TIMING'
  });

  const captionSegments: CaptionSegment[] = [];
  
  // ✅ CREATE 1-4 WORD CHUNKS for optimal readability
  const chunks: Array<{words: string[], startTime: number, endTime: number}> = [];
  let wordIndex = 0;
  
  while (wordIndex < words.length) {
    const chunkSize = Math.floor(Math.random() * 3) + 2; // 2-4 words
    const endIndex = Math.min(wordIndex + chunkSize, words.length);
    const chunkWords = words.slice(wordIndex, endIndex);
    
    // Find timing for this chunk using speech marks
    let startTime = 0;
    let endTime = 0;
    
    // Match words to speech marks (case-insensitive, handle punctuation)
    const firstWord = chunkWords[0].toLowerCase().replace(/[^\w]/g, '');
    const lastWord = chunkWords[chunkWords.length - 1].toLowerCase().replace(/[^\w]/g, '');
    
    // Find the speech mark for the first word in the chunk
    const firstMark = speechMarks.find(mark => 
      mark.word.toLowerCase().replace(/[^\w]/g, '').includes(firstWord) ||
      firstWord.includes(mark.word.toLowerCase().replace(/[^\w]/g, ''))
    );
    
    // Find the speech mark for the last word in the chunk
    const lastMark = speechMarks.findLast(mark => 
      mark.word.toLowerCase().replace(/[^\w]/g, '').includes(lastWord) ||
      lastWord.includes(mark.word.toLowerCase().replace(/[^\w]/g, ''))
    );
    
    if (firstMark) {
      startTime = firstMark.start / 1000; // Convert ms to seconds
    } else {
      // Fallback: estimate based on previous chunk
      startTime = chunks.length > 0 ? chunks[chunks.length - 1].endTime : 0;
    }
    
    if (lastMark) {
      endTime = lastMark.end / 1000; // Convert ms to seconds
    } else {
      // Fallback: add estimated duration
      endTime = startTime + (chunkWords.length * 0.5); // ~0.5s per word
    }
    
    chunks.push({
      words: chunkWords,
      startTime,
      endTime
    });
    
    wordIndex = endIndex;
  }
  
  console.log('⏱️ WORD-LEVEL TIMING:', {
    totalChunks: chunks.length,
    firstChunk: chunks[0] ? `"${chunks[0].words.join(' ')}" (${chunks[0].startTime.toFixed(2)}s-${chunks[0].endTime.toFixed(2)}s)` : 'none',
    lastChunk: chunks[chunks.length - 1] ? `"${chunks[chunks.length - 1].words.join(' ')}" (${chunks[chunks.length - 1].startTime.toFixed(2)}s-${chunks[chunks.length - 1].endTime.toFixed(2)}s)` : 'none'
  });
  
  chunks.forEach((chunk, index) => {
    // ✅ ADD EMOJIS to some captions
    let captionText = chunk.words.join(' ');
    if (Math.random() < 0.35) { // 35% chance for emoji
      captionText = addSmartEmojis(captionText);
    }
    
    // ✅ CENTER POSITIONING
    const position = getCenterPosition(aspectRatio);
    
    captionSegments.push({
      text: captionText,
      start: Math.round(chunk.startTime * 100) / 100, // Round to 2 decimal places
      end: Math.round(chunk.endTime * 100) / 100,
      x: position.x,
      y: position.y,
      fontSize: getCapCutFontSize(aspectRatio, styleType),
      style: getCapCutStyleTemplate(aspectRatio, styleType)
    });
    
    console.log(`📝 Word-Synced: "${captionText}" (${chunk.startTime.toFixed(2)}s - ${chunk.endTime.toFixed(2)}s)`);
  });

  return captionSegments;
}

// ✅ FALLBACK: Original timing method when speech marks not available
function createCapCutStyleCaptions(script: string, audioDuration: number, aspectRatio: string, styleType: string): CaptionSegment[] {
  const words = script.split(/\s+/).filter(word => word.trim());
  const totalWords = words.length;
  
  console.log('🎯 FALLBACK TIMING:', {
    totalWords,
    audioDuration: audioDuration.toFixed(3) + 's',
    method: 'PROPORTIONAL_DISTRIBUTION'
  });

  const captionSegments: CaptionSegment[] = [];
  
  // ✅ CREATE 2-4 WORD CHUNKS for better readability
  const chunks: string[][] = [];
  let wordIndex = 0;
  while (wordIndex < words.length) {
    const chunkSize = Math.floor(Math.random() * 3) + 2; // 2-4 words
    const endIndex = Math.min(wordIndex + chunkSize, words.length);
    const chunkWords = words.slice(wordIndex, endIndex);
    chunks.push(chunkWords);
    wordIndex = endIndex;
  }
  
  // ✅ DISTRIBUTE CHUNKS EVENLY ACROSS EXACT AUDIO DURATION
  const totalChunks = chunks.length;
  const timePerChunk = audioDuration / totalChunks;
  
  console.log('⏱️ TIMING DISTRIBUTION:', {
    totalChunks,
    timePerChunk: timePerChunk.toFixed(3) + 's per chunk',
    coverageCheck: (totalChunks * timePerChunk).toFixed(3) + 's'
  });
  
  chunks.forEach((chunkWords, index) => {
    const start = index * timePerChunk;
    const end = Math.min((index + 1) * timePerChunk, audioDuration); // Ensure we don't exceed audio duration
    
    // ✅ ADD EMOJIS to some captions
    let captionText = chunkWords.join(' ');
    if (Math.random() < 0.35) { // 35% chance for emoji
      captionText = addSmartEmojis(captionText);
    }
    
    // ✅ CENTER POSITIONING
    const position = getCenterPosition(aspectRatio);
    
    captionSegments.push({
      text: captionText,
      start: Math.round(start * 100) / 100, // Round to 2 decimal places
      end: Math.round(end * 100) / 100,
      x: position.x,
      y: position.y,
      fontSize: getCapCutFontSize(aspectRatio, styleType),
      style: getCapCutStyleTemplate(aspectRatio, styleType)
    });
    
    console.log(`📝 Caption: "${captionText}" (${start.toFixed(2)}s - ${end.toFixed(2)}s)`);
  });

  // ✅ FINAL VERIFICATION: Ensure last caption ends exactly at audio duration
  if (captionSegments.length > 0) {
    const firstCaption = captionSegments[0];
    const lastCaption = captionSegments[captionSegments.length - 1];
    lastCaption.end = audioDuration; // Force exact match
    
    console.log(`🎯 CAPTION SYNC VERIFICATION:`, {
      firstCaption: `"${firstCaption.text}" (${firstCaption.start}s-${firstCaption.end}s)`,
      lastCaption: `"${lastCaption.text}" (${lastCaption.start}s-${lastCaption.end}s)`,
      audioDuration: audioDuration.toFixed(3) + 's',
      totalCaptions: captionSegments.length,
      coverage: `${firstCaption.start}s to ${lastCaption.end}s`
    });
  }

  return captionSegments;
}

// ✅ FIXED: Type-safe font size mapping
function getCapCutFontSize(aspectRatio: string, styleType: string): number {
  const fontSizes: { [key: string]: number } = {
    '9:16': 42,
    '16:9': 36,
    '1:1': 40,
  };
  return fontSizes[aspectRatio] || 38;
}

// ✅ FIXED: Type-safe style template mapping
function getCapCutStyleTemplate(aspectRatio: string, styleType: string): any {
  const templates: { [key: string]: any } = {
    'default': {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      fontWeight: 'bold',
      textAlign: 'center' as const,
      maxWidth: 600,
      padding: 20,
      borderRadius: 10,
      shadow: true,
    },
    'neon': {
      backgroundColor: 'rgba(255, 0, 255, 0.9)',
      textColor: '#00FFFF',
      strokeColor: '#FF00FF',
      strokeWidth: 3,
      fontWeight: 'bold',
      textAlign: 'center' as const,
      maxWidth: 600,
      padding: 25,
      borderRadius: 15,
      shadow: true,
    },
    'classic': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#000000',
      strokeColor: '#FFFFFF',
      strokeWidth: 1,
      fontWeight: 'normal',
      textAlign: 'center' as const,
      maxWidth: 580,
      padding: 18,
      borderRadius: 8,
      shadow: false,
    },
    'fire': {
      backgroundColor: 'rgba(255, 69, 0, 0.9)',
      textColor: '#FFFF00',
      strokeColor: '#FF0000',
      strokeWidth: 2,
      fontWeight: 'bold',
      textAlign: 'center' as const,
      maxWidth: 620,
      padding: 22,
      borderRadius: 12,
      shadow: true,
    },
    'ice': {
      backgroundColor: 'rgba(135, 206, 250, 0.9)',
      textColor: '#FFFFFF',
      strokeColor: '#0000FF',
      strokeWidth: 2,
      fontWeight: 'bold',
      textAlign: 'center' as const,
      maxWidth: 600,
      padding: 20,
      borderRadius: 15,
      shadow: true,
    },
    'gold': {
      backgroundColor: 'rgba(255, 215, 0, 0.9)',
      textColor: '#000000',
      strokeColor: '#FFD700',
      strokeWidth: 2,
      fontWeight: 'bold',
      textAlign: 'center' as const,
      maxWidth: 600,
      padding: 20,
      borderRadius: 10,
      shadow: true,
    },
    'blue-tech': {
      backgroundColor: 'rgba(0, 100, 200, 0.9)',
      textColor: '#00FFFF',
      strokeColor: '#0066CC',
      strokeWidth: 2,
      fontWeight: 'bold',
      textAlign: 'center' as const,
      maxWidth: 600,
      padding: 20,
      borderRadius: 5,
      shadow: true,
    },
  };
  
  return templates[styleType] || templates['default'];
}

// ✅ FIXED: Type-safe center position mapping
function getCenterPosition(aspectRatio: string): { x: number; y: number } {
  const positions: { [key: string]: { width: number; height: number } } = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
  };
  
  const dimensions = positions[aspectRatio] || positions['9:16'];
  return {
    x: dimensions.width / 2,
    y: dimensions.height * 0.5, // ✅ FIXED: Position in CENTER, not bottom
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

// ✅ FIXED: Type-safe dimensions mapping
function getDimensions(aspectRatio: string): { width: number; height: number } {
  const dimensions: { [key: string]: { width: number; height: number } } = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 }
  };
  return dimensions[aspectRatio] || dimensions['9:16'];
} 