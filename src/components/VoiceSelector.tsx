import React, { useState, useEffect, useRef } from 'react';

interface Voice {
  voice_id: string;
  name: string;
  labels?: {
    gender?: string;
    accent?: string;
    age?: string;
    premium?: boolean;
  };
  preview_url?: string;
}

interface VoiceSelectorProps {
  onVoiceSelect: (voiceId: string, voiceName: string) => void;
  selectedVoiceId?: string;
  className?: string;
}

export default function VoiceSelector({ onVoiceSelect, selectedVoiceId, className = '' }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPremium, setFilterPremium] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    voice?: Voice;
    audioUrl?: string;
    loading: boolean;
    error?: string;
  }>({
    visible: false,
    loading: false
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    console.log('🎤 Loading voices...');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-voices', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('🎤 Voices API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🎤 Voices API response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to load voices');
      }

      setVoices(data.voices || []);
      console.log('✅ Loaded voices:', data.voices?.length || 0);

    } catch (err) {
      console.error('❌ Error loading voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    console.log('🎯 Voice selected:', voice.name);
    onVoiceSelect(voice.voice_id, voice.name);
  };

  const previewVoice = async (voice: Voice) => {
    console.log('🎵 Previewing voice:', voice.name);
    
    setPreviewModal({
      visible: true,
      voice,
      loading: true,
      error: undefined,
      audioUrl: undefined
    });

    try {
      const response = await fetch('/api/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: voice.voice_id })
      });

      console.log('🎵 Preview API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🎵 Preview API response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setPreviewModal(prev => ({
        ...prev,
        loading: false,
        audioUrl: data.audioUrl
      }));

      // Auto-play the preview
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => 
            console.log('🔇 Autoplay prevented by browser:', e)
          );
        }
      }, 100);

    } catch (err) {
      console.error('❌ Error previewing voice:', err);
      setPreviewModal(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to generate preview'
      }));
    }
  };

  const closePreviewModal = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPreviewModal({ visible: false, loading: false });
  };

  const filteredVoices = filterPremium 
    ? voices.filter(voice => voice.labels?.premium || voice.name.toLowerCase().includes('premium'))
    : voices;

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 ${className}`}>
        <div className="text-center py-20">
          <div className="relative mx-auto mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin mx-auto" style={{ animationDelay: '150ms' }}></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Voices</h3>
          <p className="text-gray-600">Fetching available voices from ElevenLabs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 ${className}`}>
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Voices</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={loadVoices}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <a 
              href="/test-voices" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Debug Tools
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 ${className}`}>
        {/* Header with Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Voice Gallery</h2>
            <p className="text-gray-600">Choose from our collection of premium AI voices</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFilterPremium(false)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                !filterPremium
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Voices
            </button>
            <button
              onClick={() => setFilterPremium(true)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                filterPremium
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Premium Only
            </button>
          </div>
        </div>

        {/* Voice Grid */}
        {filteredVoices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No voices found</h3>
            <p className="text-gray-600">Try switching to "All Voices" to see available options.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVoices.map((voice, index) => {
              const isPremium = voice.labels?.premium || voice.name.toLowerCase().includes('premium');
              const accent = voice.labels?.accent || 'Universal';
              const gender = voice.labels?.gender || 'Neutral';
              const ageGroup = voice.labels?.age || 'Adult';
              const isSelected = selectedVoiceId === voice.voice_id;

              return (
                <div
                  key={voice.voice_id}
                  className={`
                    bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                    ${isSelected 
                      ? 'border-blue-600 ring-4 ring-blue-100 shadow-xl bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    }
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleVoiceSelect(voice)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{voice.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          {gender}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {accent}
                        </span>
                        {ageGroup !== 'Adult' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {ageGroup}
                          </span>
                        )}
                      </div>
                    </div>
                    {isPremium && (
                      <div className="flex-shrink-0">
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          ⭐ Premium
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        previewVoice(voice);
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Preview Voice
                    </button>
                    
                    {isSelected && (
                      <div className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Selected ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audio Preview Modal */}
      {previewModal.visible && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Voice Preview</h3>
                <p className="text-gray-600">{previewModal.voice?.name || 'Generating audio sample...'}</p>
              </div>
              <button 
                onClick={closePreviewModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {previewModal.loading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Creating audio preview...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
              </div>
            )}
            
            {previewModal.error && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-4">Preview Failed</p>
                <p className="text-gray-600 text-sm">{previewModal.error}</p>
              </div>
            )}
            
            {previewModal.audioUrl && !previewModal.loading && !previewModal.error && (
              <div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-4">
                  <audio ref={audioRef} controls className="w-full" src={previewModal.audioUrl} />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    🔄 Replay
                  </button>
                  <button 
                    onClick={() => {
                      if (previewModal.voice) {
                        handleVoiceSelect(previewModal.voice);
                        closePreviewModal();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    ✓ Select This Voice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 