import React, { useState, useEffect } from 'react';

interface Voice {
  voice_id: string;
  name: string;
  labels?: {
    accent?: string;
    gender?: string;
    age?: string;
    premium?: boolean;
  };
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
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<Voice | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  async function loadVoices() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/get-voices');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load voices');
      }
      
      setVoices(data.voices);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load voices');
      console.error('Error loading voices:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleVoiceSelect = (voice: Voice) => {
    onVoiceSelect(voice.voice_id, voice.name);
  };

  async function previewVoice(voice: Voice) {
    try {
      setPreviewingVoice(voice);
      setPreviewModalVisible(true);
      setPreviewLoading(true);
      setPreviewError(null);
      setAudioSrc(null);

      const response = await fetch('/api/preview-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voiceId: voice.voice_id })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setAudioSrc(data.audioUrl);
      const audio = new Audio(data.audioUrl);
      audio.play().catch(console.error);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview voice');
      console.error('Error previewing voice:', error);
    } finally {
      setPreviewLoading(false);
    }
  }

  const closePreviewModal = () => {
    setPreviewModalVisible(false);
    setAudioSrc(null);
    setPreviewingVoice(null);
  };

  const filteredVoices = showPremiumOnly 
    ? voices.filter(voice => voice.labels?.premium)
    : voices;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={loadVoices}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filter Controls */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowPremiumOnly(!showPremiumOnly)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showPremiumOnly
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Premium Only
        </button>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => (
          <div
            key={voice.voice_id}
            className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all transform hover:scale-102 hover:shadow-lg ${
              selectedVoiceId === voice.voice_id
                ? 'ring-2 ring-purple-500'
                : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900">{voice.name}</h3>
                {voice.labels?.premium && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-xs text-white px-2 py-1 rounded-full font-medium">
                    Premium
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {voice.labels?.gender && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {voice.labels.gender}
                  </span>
                )}
                {voice.labels?.accent && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {voice.labels.accent}
                  </span>
                )}
                {voice.labels?.age && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {voice.labels.age}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => previewVoice(voice)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Preview Voice
                </button>
                <button
                  onClick={() => handleVoiceSelect(voice)}
                  className={`text-sm transition-colors ${
                    selectedVoiceId === voice.voice_id
                      ? 'text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {selectedVoiceId === voice.voice_id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {previewingVoice?.name || 'Voice Preview'}
              </h3>
              <button
                onClick={closePreviewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {previewLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Generating preview...</p>
              </div>
            )}

            {previewError && (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">Error: {previewError}</div>
                <button
                  onClick={() => previewingVoice && previewVoice(previewingVoice)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {audioSrc && !previewLoading && !previewError && (
              <div>
                <audio
                  controls
                  className="w-full mb-4"
                  src={audioSrc}
                  autoPlay
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => previewingVoice && previewVoice(previewingVoice)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded transition-colors"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => {
                      if (previewingVoice) {
                        handleVoiceSelect(previewingVoice);
                        closePreviewModal();
                      }
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors"
                  >
                    Select Voice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 