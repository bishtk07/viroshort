import type { APIRoute } from 'astro';

interface GenerateImagesRequest {
  script?: string
  prompts?: string[]
  audioDuration?: number
  style?: string
  aspectRatio?: string
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log("🎨 generate-images: Starting image generation...");
    
    // Get Replicate API token from Cloudflare environment variables
    const replicateApiKey = 
      (locals as any)?.runtime?.env?.REPLICATE_API_TOKEN ||
      import.meta.env.REPLICATE_API_TOKEN ||
      process.env.REPLICATE_API_TOKEN;

    console.log('🎨 generate-images: Environment check:', {
      hasCloudflareEnv: !!((locals as any)?.runtime?.env?.REPLICATE_API_TOKEN),
      hasImportMetaEnv: !!import.meta.env.REPLICATE_API_TOKEN,
      hasProcessEnv: !!process.env.REPLICATE_API_TOKEN,
      finalKeyFound: !!replicateApiKey,
      keyLength: replicateApiKey ? replicateApiKey.length : 0
    });

    if (!replicateApiKey) {
      console.error('🚨 generate-images: Replicate API key not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Replicate API key not configured. Please add REPLICATE_API_TOKEN to your environment variables.',
        debug: {
          hasCloudflareEnv: !!((locals as any)?.runtime?.env?.REPLICATE_API_TOKEN),
          hasImportMetaEnv: !!import.meta.env.REPLICATE_API_TOKEN,
          hasProcessEnv: !!process.env.REPLICATE_API_TOKEN
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data: GenerateImagesRequest = await request.json()
    console.log('🎬 Image generation request received:', data)

    // Handle both old and new formats
    let prompts: string[]
    let script = data.script || ''
    let audioDuration = data.audioDuration || 30
    let aspectRatio = data.aspectRatio || '9:16'
    let style = data.style || 'viroshorts'

    // Get the base URL from the request
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    if (data.prompts && Array.isArray(data.prompts)) {
      prompts = data.prompts
      console.log('📝 Using provided prompts:', prompts.length, 'items')
    } else if (script) {
      console.log('📖 Processing script for image generation')
      
      // Try to segment the script first
      try {
        const segmentResponse = await fetch(`${baseUrl}/api/segment-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script, audioDuration })
        })
        
        if (segmentResponse.ok) {
          const segmentData = await segmentResponse.json()
          if (segmentData.segments && segmentData.segments.length > 0) {
            prompts = segmentData.segments.map((segment: any) => {
              // Handle both string segments and object segments with text property
              const text = typeof segment === 'string' ? segment : (segment.text || segment.content || String(segment))
              return text.trim()
            }).filter((text: string) => text.length > 0)
            console.log('✅ Script segmented into', prompts.length, 'parts')
          } else {
            throw new Error('No segments returned')
          }
        } else {
          throw new Error('Segment API failed')
        }
      } catch (error) {
        console.log('⚠️ Segmentation failed, using sentence splitting:', error)
        // Fallback: Split by sentences
        prompts = script.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10)
      }
    } else {
      throw new Error('No script or prompts provided')
    }

    console.log(`🎨 Generating ${prompts.length} images using REPLICATE FLUX`)

    // ✅ FIXED: Generate images sequentially to avoid overwhelming the API
    const results = []
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]
      const styledPrompt = createStyledPrompt(prompt, style)
      
      console.log(`🎨 Generating FLUX image ${i + 1}/${prompts.length}`)
      
      const result = await generateSingleImageWithReplicate(
        styledPrompt, 
        replicateApiKey, 
        `${i + 1}`, 
        aspectRatio
      )
      
      results.push(result)
      
      // ✅ Rate limiting: Wait between requests
      if (i < prompts.length - 1) {
        console.log('⏳ Waiting 2 seconds between FLUX generations...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Process results
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    console.log(`✅ Successfully generated ${successful.length} FLUX images`)
    console.log(`❌ Failed to generate ${failed.length} images`)

    if (successful.length === 0) {
      return new Response(JSON.stringify({
        error: 'All image generations failed',
        details: failed.map(f => f.error).join('; ')
      }), { status: 500 })
    }

    return new Response(JSON.stringify({
      images: successful.map(r => r.imageUrl),
      summary: {
        totalPrompts: prompts.length,
        successful: successful.length,
        failed: failed.length,
        quality: 'FLUX High-quality',
        aspectRatio: aspectRatio,
        style: style,
        model: 'REPLICATE FLUX'
      },
      errors: failed.length > 0 ? failed.map(f => f.error) : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Image generation error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 })
  }
}

// ✅ RESTORED: Style prompt creation for FLUX
function createStyledPrompt(text: string, style: string): string {
  let basePrompt = text.trim()
  let stylePrefix = ""
  
  switch (style?.toLowerCase()) {
    case 'minecraft':
      stylePrefix = "Minecraft style, blocky pixel art, cubic blocks, voxel art, minecraft game graphics"
      break
    case 'anime':
      stylePrefix = "Anime art style, manga illustration, cel-shaded, vibrant anime colors"
      break
    case 'lego':
      stylePrefix = "LEGO brick style, plastic building blocks, toy photography"
      break
    case 'comic-book':
    case 'comic':
      stylePrefix = "Comic book illustration, bold comic style, graphic novel art"
      break
    case 'watercolor':
      stylePrefix = "Watercolor painting, soft brushstrokes, artistic painting"
      break
    case 'photorealism':
    case 'realistic':
      stylePrefix = "Photorealistic, ultra-realistic, professional photography"
      break
    case 'disney':
      stylePrefix = "Disney animation style, magical cartoon, colorful Disney art"
      break
    default:
      stylePrefix = "Professional cinematic style, high quality"
      break
  }
  
  const enhancedPrompt = `${stylePrefix}, ${basePrompt}, high quality, detailed, professional`
  console.log('🎯 FLUX prompt:', enhancedPrompt.substring(0, 100) + '...')
  return enhancedPrompt
}

// ✅ RESTORED: Replicate FLUX image generation
async function generateSingleImageWithReplicate(
  prompt: string, 
  apiKey: string, 
  imageId: string,
  aspectRatio: string,
  maxRetries: number = 3
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎨 Generating FLUX image ${imageId} (attempt ${attempt}/${maxRetries})`)
      
      // Convert aspect ratio to FLUX format
      let fluxAspectRatio = "9:16"
      if (aspectRatio === '16:9') {
        fluxAspectRatio = "16:9"
      } else if (aspectRatio === '1:1') {
        fluxAspectRatio = "1:1"
      }

      // Start FLUX prediction
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "black-forest-labs/flux-schnell", 
            input: {
            prompt: prompt,
            aspect_ratio: fluxAspectRatio,
              num_outputs: 1,
            output_format: "webp",
            output_quality: 90
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.detail || `HTTP ${response.status}`
        
        if (response.status === 429 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`⏳ Rate limited for FLUX image ${imageId}, waiting ${waitTime/1000}s...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        return { success: false, error: `FLUX API error for image ${imageId}: ${errorMsg}` }
      }

      const prediction = await response.json()
      
      // Poll for completion
      let checkCount = 0
      const maxChecks = 30 // 1 minute timeout
      
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && checkCount < maxChecks) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${apiKey}`,
          }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          Object.assign(prediction, statusData)
        }
        
        checkCount++
        console.log(`🔄 FLUX image ${imageId} status: ${prediction.status} (${checkCount}/${maxChecks})`)
      }

      if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
        console.log(`✅ FLUX image ${imageId} generated successfully`)
        return { success: true, imageUrl: prediction.output[0] }
      } else if (prediction.status === 'failed') {
        return { success: false, error: `FLUX generation failed for image ${imageId}: ${prediction.error || 'Unknown error'}` }
      } else {
        return { success: false, error: `FLUX timeout for image ${imageId}` }
      }

  } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`💥 Exception generating FLUX image ${imageId} (attempt ${attempt}):`, errorMsg)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      
      return { success: false, error: `Exception for FLUX image ${imageId}: ${errorMsg}` }
    }
  }
  
  return { success: false, error: `Failed to generate FLUX image ${imageId} after ${maxRetries} attempts` }
} 
