import type { APIRoute } from 'astro';

// Updated interface based on actual Fish Audio API response
interface FishAudioModel {
  _id: string;
  type: string;
  title: string;
  description: string;
  cover_image?: string;
  train_mode: string;
  state: string;
  tags: string[];
  samples: Array<{
    title: string;
    text: string;
    task_id: string;
    audio: string;
  }>;
  created_at: string;
  updated_at: string;
  languages: string[];
  visibility: string;
  lock_visibility: boolean;
  default_text: string;
  like_count: number;
  mark_count: number;
  shared_count: number;
  task_count: number;
  unliked: boolean;
  liked: boolean;
  marked: boolean;
  author: {
    _id: string;
    nickname: string;
    avatar?: string;
  };
}

// Updated interface for Fish Audio API response
interface FishAudioResponse {
  items: FishAudioModel[];
  total: number;
}

interface ProcessedVoice {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  category: 'celebrity' | 'popular' | 'normal';
  premium: boolean;
  gender?: string;
  accent?: string;
  age?: string;
  language: string[];
  tags: string[];
  like_count: number;
  author: string;
}

// Enhanced celebrity keywords
const CELEBRITY_KEYWORDS = [
  // Politicians & World Leaders
  'trump', 'biden', 'obama', 'putin', 'xi jinping', 'modi', 'merkel', 'macron', 'johnson', 'churchill',
  
  // Actors & Actresses
  'morgan freeman', 'samuel jackson', 'robert downey', 'scarlett johansson', 'leonardo dicaprio', 
  'tom hanks', 'will smith', 'denzel washington', 'brad pitt', 'angelina jolie', 'jennifer lawrence',
  'chris evans', 'chris hemsworth', 'ryan reynolds', 'dwayne johnson', 'the rock',
  
  // Musicians & Singers
  'taylor swift', 'beyonce', 'drake', 'kanye west', 'eminem', 'rihanna', 'justin bieber', 'ariana grande',
  'ed sheeran', 'adele', 'billie eilish', 'weeknd', 'bruno mars', 'lady gaga', 'elvis', 'michael jackson',
  
  // Tech Leaders
  'elon musk', 'bill gates', 'steve jobs', 'mark zuckerberg', 'jeff bezos', 'tim cook',
  
  // TV & Movie Characters
  'spongebob', 'patrick star', 'squidward', 'homer simpson', 'bart simpson', 'peter griffin', 
  'stewie griffin', 'rick sanchez', 'morty smith', 'batman', 'superman', 'iron man', 'captain america',
  'darth vader', 'yoda', 'gandalf', 'gollum', 'shrek', 'woody', 'buzz lightyear',
  
  // Anime Characters
  'naruto', 'goku', 'vegeta', 'luffy', 'ichigo', 'natsu', 'edward elric', 'light yagami',
  
  // Historical Figures
  'einstein', 'lincoln', 'washington', 'napoleon', 'caesar', 'cleopatra', 'gandhi', 'martin luther king',
  
  // YouTubers & Internet Personalities
  'pewdiepie', 'mrbeast', 'markiplier', 'jacksepticeye', 'logan paul', 'jake paul',
  
  // Voice Actors
  'mel blanc', 'frank welker', 'tara strong', 'tom kenny', 'billy west', 'maurice lamarche'
];

function isCelebrity(voice: FishAudioModel): boolean {
  const searchText = [
    voice.title,
    voice.description,
    voice.author?.nickname || '',
    ...(voice.tags || [])
  ].join(' ').toLowerCase();

  return CELEBRITY_KEYWORDS.some(keyword => 
    searchText.includes(keyword.toLowerCase())
  );
}

function categorizeVoice(voice: FishAudioModel): 'celebrity' | 'popular' | 'normal' {
  // Check for celebrity keywords first
  if (isCelebrity(voice)) {
    return 'celebrity';
  }
  
  // Check for popular voices based on engagement metrics
  const isPopular = voice.like_count > 100 || 
                   voice.task_count > 10000 || 
                   voice.mark_count > 100;
  
  if (isPopular) {
    return 'popular';
  }
  
  return 'normal';
}

function processVoice(voice: FishAudioModel): ProcessedVoice {
  const previewUrl = voice.samples?.[0]?.audio || '';
  
  return {
    id: voice._id,
    name: voice.title,
    description: voice.description || voice.default_text || '',
    preview_url: previewUrl,
    category: categorizeVoice(voice),
    premium: false, // Fish Audio doesn't seem to have premium tiers
    language: voice.languages || ['en'],
    tags: voice.tags || [],
    like_count: voice.like_count || 0,
    author: voice.author?.nickname || 'Unknown'
  };
}

export const GET: APIRoute = async () => {
  try {
    console.log('🎤 get-fish-voices: Starting to fetch Fish Audio voices...');
    
    // Get Fish Audio API key
    const FISH_AUDIO_API_KEY = 
      import.meta.env.FISH_AUDIO_API_KEY || 
      process.env.FISH_AUDIO_API_KEY;
    
    if (!FISH_AUDIO_API_KEY || FISH_AUDIO_API_KEY === 'your_fish_audio_api_key_here') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Fish Audio API key not configured' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch voices from Fish Audio API with larger page size
    const response = await fetch('https://api.fish.audio/model?page_size=100&page_number=1&visibility=public', {
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎤 get-fish-voices: Fish Audio API error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Fish Audio API error: ${response.status}` 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data: FishAudioResponse = await response.json();
    console.log(`🎤 get-fish-voices: Fetched ${data.items?.length || 0} voices from Fish Audio API`);

    if (!data.items || data.items.length === 0) {
      console.log('🎤 get-fish-voices: No voices found in API response');
      return new Response(
        JSON.stringify({
          success: true,
          celebrity: [],
          popular: [],
          normal: [],
          stats: {
            total_fetched: 0,
            celebrity_count: 0,
            popular_count: 0,
            normal_count: 0
          }
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process and categorize voices
    const processedVoices = data.items.map(processVoice);
    
    const celebrity = processedVoices.filter(v => v.category === 'celebrity');
    const popular = processedVoices.filter(v => v.category === 'popular');
    const normal = processedVoices.filter(v => v.category === 'normal');

    console.log(`🎤 get-fish-voices: Categorized voices - Celebrity: ${celebrity.length}, Popular: ${popular.length}, Normal: ${normal.length}`);

    // Log some examples for debugging
    if (celebrity.length > 0) {
      console.log('🎤 get-fish-voices: Celebrity examples:', celebrity.slice(0, 3).map(v => v.name));
    }
    if (popular.length > 0) {
      console.log('🎤 get-fish-voices: Popular examples:', popular.slice(0, 3).map(v => v.name));
    }

    return new Response(
      JSON.stringify({
        success: true,
        celebrity: celebrity.slice(0, 20), // Limit to 20 per category
        popular: popular.slice(0, 20),
        normal: normal.slice(0, 20),
        stats: {
          total_fetched: data.items.length,
          celebrity_count: celebrity.length,
          popular_count: popular.length,
          normal_count: normal.length
        }
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('🎤 get-fish-voices: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch Fish Audio voices',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 