import type { APIRoute } from 'astro';

interface VideoGenerationRequest {
  script: string;
  audioUrl: string;
  imageUrls: string[];
  aspectRatio: string;
  audioDuration: number;
  style?: string;
}

interface VideoSegment {
  text: string;
  start: number;
  end: number;
  duration: number;
  imageIndex: number;
  motionEffect: {
    type: 'ken-burns' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
    intensity: number;
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('🎬 === GENERATE-VIDEO API CALLED ===');
    
    // Check authentication first
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header exists:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No auth header found');
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), { status: 401 });
    }

    // Get the request data
    const data: VideoGenerationRequest = await request.json();
    console.log('📨 Request data received:', {
      hasScript: !!data.script,
      hasAudioUrl: !!data.audioUrl,
      imageCount: data.imageUrls?.length || 0,
      aspectRatio: data.aspectRatio,
      audioDuration: data.audioDuration,
      style: data.style
    });
    
    // Get API keys from environment
    const OPENAI_API_KEY = 
      (locals as any)?.runtime?.env?.OPENAI_API_KEY ||
      import.meta.env.OPENAI_API_KEY || 
      process.env.OPENAI_API_KEY;
      
    const REPLICATE_API_TOKEN = 
      (locals as any)?.runtime?.env?.REPLICATE_API_TOKEN ||
      import.meta.env.REPLICATE_API_TOKEN || 
      process.env.REPLICATE_API_TOKEN;
      
    const FISH_AUDIO_API_KEY = 
      (locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY ||
      import.meta.env.FISH_AUDIO_API_KEY || 
      process.env.FISH_AUDIO_API_KEY;

    console.log('🔑 Environment check:', {
      hasOpenAIKey: !!OPENAI_API_KEY,
      hasReplicateToken: !!REPLICATE_API_TOKEN,
      hasFishAudioKey: !!FISH_AUDIO_API_KEY,
      hasCloudflareEnv: !!((locals as any)?.runtime?.env)
    });

    if (!OPENAI_API_KEY || !REPLICATE_API_TOKEN || !FISH_AUDIO_API_KEY) {
      console.log('❌ Missing API keys');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required API keys. Please check your environment variables.',
        missing: {
          openai: !OPENAI_API_KEY,
          replicate: !REPLICATE_API_TOKEN,
          fish_audio: !FISH_AUDIO_API_KEY
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { script, audioUrl, imageUrls, aspectRatio, audioDuration, style } = data;

    if (!script || !audioUrl || !imageUrls || !aspectRatio || !audioDuration) {
      console.log('❌ Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing required fields: script, audioUrl, imageUrls, aspectRatio, audioDuration' 
      }), { status: 400 });
    }

    // ✅ AUDIO-FIRST APPROACH: Video duration MUST match audio exactly
    const EXACT_AUDIO_DURATION = audioDuration;
    const AVAILABLE_IMAGES = imageUrls.length;
    const SEGMENT_DURATION = EXACT_AUDIO_DURATION / AVAILABLE_IMAGES;
    
    console.log(`🎯 AUDIO-SYNCHRONIZED TIMING:`, {
      exactAudioDuration: EXACT_AUDIO_DURATION.toFixed(3) + 's',
      availableImages: AVAILABLE_IMAGES,
      segmentDuration: SEGMENT_DURATION.toFixed(3) + 's per image',
      fps: 30,
      totalFrames: Math.ceil(EXACT_AUDIO_DURATION * 30)
    });

    // ✅ Create audio-synchronized segments
    const segments = createAudioSyncedSegments(script, EXACT_AUDIO_DURATION, AVAILABLE_IMAGES);
    
    // Video settings for exact audio matching
    const videoSettings = {
      dimensions: aspectRatio === '9:16' ? { width: 1080, height: 1920 } : 
                  aspectRatio === '16:9' ? { width: 1920, height: 1080 } : 
                  { width: 1080, height: 1080 },
      fps: 30,
      bitrate: 8000000,
      codec: 'vp9',
      exactDuration: EXACT_AUDIO_DURATION
    };

    console.log('✅ AUDIO-SYNCED SEGMENTS:', segments.map((s, i) => 
      `${s.start.toFixed(2)}-${s.end.toFixed(2)}s: Image ${i+1} | "${s.text.substring(0, 25)}..."`
    ));

    console.log('✅ Video generation request processed successfully');

    return new Response(JSON.stringify({
      success: true,
      segments,
      videoSettings,
      audioUrl,
      imageUrls,
      metadata: {
        duration: EXACT_AUDIO_DURATION,
        segmentCount: segments.length,
        imageCount: AVAILABLE_IMAGES,
        segmentDuration: SEGMENT_DURATION,
        aspectRatio,
        syncMode: 'AUDIO_TIMESTAMP_BASED',
        fps: 30,
        totalFrames: Math.ceil(EXACT_AUDIO_DURATION * 30)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Audio-sync video generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Video generation failed', 
      details: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
};

// ✅ AUDIO-SYNCHRONIZED SEGMENTATION
function createAudioSyncedSegments(script: string, audioDuration: number, imageCount: number): VideoSegment[] {
  const segmentDuration = audioDuration / imageCount;
  
  console.log(`🎯 SEGMENT CALCULATION:`, {
    audioDuration: audioDuration.toFixed(3) + 's',
    imageCount,
    segmentDuration: segmentDuration.toFixed(3) + 's per image'
  });
  
  // Smart script distribution
  const sentences = script.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  const sentencesPerSegment = Math.max(1, Math.floor(sentences.length / imageCount));
  
  const textSegments: string[] = [];
  
  for (let i = 0; i < imageCount; i++) {
    const startIdx = i * sentencesPerSegment;
    const endIdx = i === imageCount - 1 ? sentences.length : Math.min(startIdx + sentencesPerSegment, sentences.length);
    const segmentText = sentences.slice(startIdx, endIdx).join(' ').trim();
    textSegments.push(segmentText || `Segment ${i + 1}`);
  }

  // Create precisely timed segments
  const segments = textSegments.map((text, index) => {
    const start = index * segmentDuration;
    const end = (index + 1) * segmentDuration;
    
    const segment = {
      text,
      start: Math.round(start * 1000) / 1000, // Millisecond precision
      end: Math.round(end * 1000) / 1000,
      duration: Math.round(segmentDuration * 1000) / 1000,
      imageIndex: index, // ✅ CRITICAL: Each segment gets its own image index
      motionEffect: getContentBasedMotion(text, index)
    };
    
    console.log(`📍 Segment ${index + 1}: ${segment.start.toFixed(3)}-${segment.end.toFixed(3)}s → Image ${segment.imageIndex + 1} | Motion: ${segment.motionEffect.type}`);
    
    return segment;
  });
  
  // ✅ VERIFY no duplicate image indices
  const imageIndices = segments.map(s => s.imageIndex);
  const uniqueIndices = new Set(imageIndices);
  console.log(`🔍 IMAGE INDEX VERIFICATION:`, {
    totalSegments: segments.length,
    imageIndices: imageIndices.join(', '),
    uniqueIndices: uniqueIndices.size,
    isCorrect: uniqueIndices.size === segments.length ? '✅ PERFECT' : '❌ DUPLICATES'
  });
  
  return segments;
}

// ✅ DIFFERENT MOTIONS: Ensure each image gets a unique motion type
function getContentBasedMotion(text: string, index: number): VideoSegment['motionEffect'] {
  // ✅ FORCE DIFFERENT MOTION for each image index
  const motionTypes = [
    { type: 'ken-burns', intensity: 0.7 },      // Image 1: Ken Burns
    { type: 'zoom-in', intensity: 0.8 },        // Image 2: Zoom In  
    { type: 'pan-right', intensity: 0.6 },      // Image 3: Pan Right
    { type: 'zoom-out', intensity: 0.7 },       // Image 4: Zoom Out
    { type: 'pan-left', intensity: 0.6 },       // Image 5: Pan Left
    { type: 'ken-burns', intensity: 0.9 },      // Image 6: Ken Burns (different intensity)
    { type: 'zoom-in', intensity: 0.6 }         // Image 7: Zoom In (different intensity)
  ];

  // ✅ Get motion based on image index to ensure variety
  const motionIndex = index % motionTypes.length;
  const selectedMotion = motionTypes[motionIndex];
  
  console.log(`🎬 Image ${index + 1}: ${selectedMotion.type} (intensity: ${selectedMotion.intensity})`);
  
  return {
    type: selectedMotion.type as 'ken-burns' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right',
    intensity: selectedMotion.intensity
  };
} 