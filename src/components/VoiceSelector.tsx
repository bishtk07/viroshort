import React, { useState, useEffect, useRef } from 'react';

interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
  labels: {
    gender?: string;
    accent?: string;
    age?: string;
    [key: string]: string | undefined;
  };
}

interface VoiceSelectorProps {
  script: string;
  onVoiceSelect: (voiceId: string) => void;
}

export function VoiceSelector({ script, onVoiceSelect }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    gender: 'all',
    age: 'all',
    accent: 'all'
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/get-voices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      if (!data.voices || !Array.isArray(data.voices)) {
        throw new Error('Invalid voice data received');
      }

      setVoices(data.voices);
    } catch (err) {
      console.error('Error fetching voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch voices');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceSelect(voiceId);
  };

  const playPreview = async (voice: Voice) => {
    try {
      // Stop any currently playing preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingPreview(null);
      }

      // Create new audio element
      const audio = new Audio(voice.preview_url);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setPlayingPreview(null);
        audioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio preview error:', e);
        setPlayingPreview(null);
        audioRef.current = null;
      });

      // Play the preview
      setPlayingPreview(voice.voice_id);
      await audio.play();
    } catch (err) {
      console.error('Error playing preview:', err);
      setPlayingPreview(null);
    }
  };

  const filteredVoices = voices.filter(voice => {
    const genderMatch = filter.gender === 'all' || voice.labels?.gender === filter.gender;
    const ageMatch = filter.age === 'all' || voice.labels?.age === filter.age;
    const accentMatch = filter.accent === 'all' || voice.labels?.accent === filter.accent;
    return genderMatch && ageMatch && accentMatch;
  });

  const handleContinue = () => {
    if (selectedVoice) {
      // Navigate to the video generation page
      window.location.href = `/video-generation?voice=${selectedVoice}&script=${encodeURIComponent(script)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading voices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchVoices}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry Loading Voices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Voices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filter.gender}
            onChange={(e) => setFilter(prev => ({ ...prev, gender: e.target.value }))}
          >
            <option value="all">All Genders</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non-binary">Non-binary</option>
          </select>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filter.age}
            onChange={(e) => setFilter(prev => ({ ...prev, age: e.target.value }))}
          >
            <option value="all">All Ages</option>
            <option value="young">Young</option>
            <option value="middle_aged">Middle Aged</option>
            <option value="old">Old</option>
          </select>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filter.accent}
            onChange={(e) => setFilter(prev => ({ ...prev, accent: e.target.value }))}
          >
            <option value="all">All Accents</option>
            <option value="american">American</option>
            <option value="british">British</option>
            <option value="australian">Australian</option>
          </select>
        </div>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => (
          <div
            key={voice.voice_id}
            className={`bg-white rounded-xl border-2 transition-all duration-200 ${
              selectedVoice === voice.voice_id
                ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{voice.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {voice.labels?.gender && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                        {voice.labels.gender}
                      </span>
                    )}
                    {voice.labels?.accent && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                        {voice.labels.accent}
                      </span>
                    )}
                  </div>
                </div>
                {voice.labels?.premium && (
                  <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium">
                    ⭐ Premium
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => playingPreview === voice.voice_id ? 
                    (audioRef.current?.pause(), setPlayingPreview(null)) : 
                    playPreview(voice)
                  }
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  {playingPreview === voice.voice_id ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Preview Voice
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleVoiceSelect(voice.voice_id)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedVoice === voice.voice_id
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-white text-blue-500 border-2 border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {selectedVoice === voice.voice_id ? 'Selected' : 'Select Voice'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVoice && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium text-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
          >
            Continue to Generate Video
          </button>
        </div>
      )}
    </div>
  );
} 