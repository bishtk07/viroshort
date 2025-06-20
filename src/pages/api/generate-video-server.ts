import type { APIRoute } from 'astro';

interface VideoJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  script: string;
  audioUrl: string;
  imageUrls: string[];
  aspectRatio: string;
  style: string;
  progress: number;
  videoUrl?: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  error?: string;
  createdAt: Date;
}

interface MuxAsset {
  id: string;
  status: string;
  playback_ids: Array<{
    id: string;
    policy: string;
  }>;
  master_access: string;
  mp4_support: string;
}

// In-memory job queue (use Redis in production)
const videoJobs = new Map<string, VideoJob>();

// Mux API Configuration
const MUX_TOKEN_ID = import.meta.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = import.meta.env.MUX_TOKEN_SECRET;
const MUX_BASE_URL = 'https://api.mux.com';

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('🚨 Mux API credentials not configured. Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET to your .env file');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { script, audioUrl, imageUrls, aspectRatio, style } = data;

    // Validate required fields
    if (!script || !imageUrls || imageUrls.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: script and imageUrls are required' 
      }), { status: 400 });
    }

    // Create job ID
    const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create job entry
    const job: VideoJob = {
      id: jobId,
      status: 'queued',
      script,
      audioUrl,
      imageUrls,
      aspectRatio: aspectRatio || '9:16',
      style: style || 'viroshorts',
      progress: 0,
      createdAt: new Date()
    };

    videoJobs.set(jobId, job);

    console.log(`🎬 Created video job ${jobId} with ${imageUrls.length} images`);

    // Process video in background (don't await)
    processVideoJob(jobId);

    return new Response(JSON.stringify({
      success: true,
      jobId,
      status: 'queued',
      message: 'Video generation started. Use the job ID to check status.',
      estimatedTime: '2-5 minutes'
    }), {
      status: 202, // Accepted
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Video job creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create video job',
      details: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const jobId = url.searchParams.get('jobId');
  
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), { status: 400 });
  }

  const job = videoJobs.get(jobId);
  
  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
  }

  // If job is completed, try to get the latest Mux status
  if (job.muxAssetId && job.status === 'processing') {
    try {
      const muxStatus = await getMuxAssetStatus(job.muxAssetId);
      if (muxStatus.status === 'ready') {
        job.status = 'completed';
        job.progress = 100;
        job.videoUrl = `https://stream.mux.com/${job.muxPlaybackId}.mp4`;
      }
    } catch (error) {
      console.error('Error checking Mux status:', error);
    }
  }

  return new Response(JSON.stringify({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    videoUrl: job.videoUrl,
    muxPlaybackId: job.muxPlaybackId,
    error: job.error,
    estimatedTimeRemaining: job.status === 'processing' ? '1-3 minutes' : null
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

async function processVideoJob(jobId: string) {
  const job = videoJobs.get(jobId);
  if (!job) return;

  try {
    console.log(`🚀 Processing video job ${jobId}`);
    job.status = 'processing';
    job.progress = 10;

    // Step 1: Generate video segments and settings (20%)
    console.log(`📝 Generating video segments for job ${jobId}`);
    const segmentResponse = await fetch('http://localhost:4321/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: job.script,
        audioUrl: job.audioUrl,
        imageUrls: job.imageUrls,
        aspectRatio: job.aspectRatio,
        audioDuration: 30, // TODO: Calculate from actual audio
        style: job.style
      })
    });

    if (!segmentResponse.ok) {
      throw new Error(`Failed to generate video segments: ${segmentResponse.statusText}`);
    }

    const { segments, videoSettings } = await segmentResponse.json();
    job.progress = 30;

    console.log(`📊 Generated ${segments.length} segments for job ${jobId}`);

    // Step 2: Create Mux video using their professional API
    const videoUrl = await generateVideoWithMux({
      jobId,
      segments,
      audioUrl: job.audioUrl,
      imageUrls: job.imageUrls,
      videoSettings,
      onProgress: (progress) => {
        job.progress = 30 + (progress * 0.7); // 30% to 100%
        console.log(`📈 Job ${jobId} progress: ${job.progress}%`);
      }
    });

    job.status = 'completed';
    job.progress = 100;
    job.videoUrl = videoUrl;

    console.log(`✅ Video job ${jobId} completed: ${videoUrl}`);

  } catch (error) {
    console.error(`❌ Video job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
  }
}

async function generateVideoWithMux(options: {
  jobId: string;
  segments: any[];
  audioUrl: string;
  imageUrls: string[];
  videoSettings: any;
  onProgress: (progress: number) => void;
}): Promise<string> {
  const { jobId, segments, audioUrl, imageUrls, videoSettings, onProgress } = options;

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    throw new Error('Mux API credentials not configured. Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET to your .env file');
  }

  try {
    console.log(`🎥 Starting Mux video generation for job ${jobId}`);
    onProgress(0);

    // Step 1: Create Mux Asset with input settings
    const muxAssetData = {
      input: [
        {
          url: audioUrl || 'https://example.com/placeholder-audio.mp3', // Use provided audio or placeholder
          type: 'audio'
        },
        ...imageUrls.map((imageUrl, index) => ({
          url: imageUrl,
          type: 'video',
          // Apply Ken Burns effect and timing based on segments
          settings: {
            start_time: segments[index]?.startTime || (index * 3),
            duration: segments[index]?.duration || 3,
            // Ken Burns zoom effect
            video_filters: [
              {
                name: 'scale',
                options: '1920:1080'
              },
              {
                name: 'zoompan',
                options: `z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=${segments[index]?.duration * 25 || 75}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`
              }
            ]
          }
        }))
      ],
      // Mux output settings optimized for social media
      playback_policy: ['public'],
      master_access: 'temporary',
      mp4_support: 'standard',
      normalize_audio: true,
      // Video quality settings
      encoding_tier: 'smart', // Mux's AI-optimized encoding
      video_quality: 'plus',   // Higher quality tier
      // Aspect ratio handling
      aspect_ratio: videoSettings.aspectRatio === '9:16' ? '9:16' : '16:9',
      resolution_tier: '1080p'
    };

    onProgress(20);

    // Create Mux Asset
    const createAssetResponse = await fetch(`${MUX_BASE_URL}/video/v1/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify(muxAssetData)
    });

    if (!createAssetResponse.ok) {
      const errorText = await createAssetResponse.text();
      throw new Error(`Mux asset creation failed: ${createAssetResponse.status} - ${errorText}`);
    }

    const assetData: { data: MuxAsset } = await createAssetResponse.json();
    const asset = assetData.data;

    console.log(`📦 Created Mux asset ${asset.id} for job ${jobId}`);

    // Store Mux asset info in job
    const job = videoJobs.get(jobId);
    if (job) {
      job.muxAssetId = asset.id;
      job.muxPlaybackId = asset.playback_ids[0]?.id;
    }

    onProgress(40);

    // Step 2: Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const status = await getMuxAssetStatus(asset.id);
      
      console.log(`🔄 Mux asset ${asset.id} status: ${status.status} (attempt ${attempts + 1})`);
      
      if (status.status === 'ready') {
        onProgress(100);
        const playbackId = status.playback_ids[0]?.id || asset.playback_ids[0]?.id;
        return `https://stream.mux.com/${playbackId}.mp4`;
      } else if (status.status === 'errored') {
        throw new Error(`Mux video processing failed`);
      }
      
      // Update progress based on processing time
      const progressPercent = Math.min(90, 40 + (attempts * 2));
      onProgress(progressPercent);
      
      attempts++;
    }

    throw new Error('Mux video processing timeout after 5 minutes');

  } catch (error) {
    console.error(`❌ Mux video generation failed for job ${jobId}:`, error);
    throw error;
  }
}

async function getMuxAssetStatus(assetId: string): Promise<MuxAsset> {
  const response = await fetch(`${MUX_BASE_URL}/video/v1/assets/${assetId}`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get Mux asset status: ${response.statusText}`);
  }

  const data: { data: MuxAsset } = await response.json();
  return data.data;
}

// Cleanup function to remove old jobs (call periodically)
export function cleanupOldJobs() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [jobId, job] of videoJobs.entries()) {
    if (job.createdAt < oneHourAgo) {
      videoJobs.delete(jobId);
    }
  }
}

// Auto-cleanup every 30 minutes
setInterval(cleanupOldJobs, 30 * 60 * 1000); 