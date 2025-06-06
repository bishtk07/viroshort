import React, { useState } from 'react';
import VoiceSelector from './VoiceSelector';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresTopic?: boolean;
}

const templates: Template[] = [
  {
    id: 'scary-stories',
    name: 'Scary Stories',
    description: 'Generate viral scary stories with psychological horror and tension building.',
    icon: '👻',
    requiresTopic: false
  },
  {
    id: 'educational',
    name: 'Educational',
    description: 'Create engaging educational content about any topic.',
    icon: '📚',
    requiresTopic: true
  },
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Generate detailed product reviews and comparisons.',
    icon: '⭐',
    requiresTopic: true
  },
  {
    id: 'travel',
    name: 'Travel Destinations',
    description: 'Create beautiful videos about travel destinations and experiences.',
    icon: '✈️',
    requiresTopic: true
  },
  {
    id: 'whatif',
    name: 'What If?',
    description: 'Explore hypothetical scenarios and their fascinating implications.',
    icon: '🤔',
    requiresTopic: true
  },
  {
    id: 'facts',
    name: 'Fun Facts',
    description: 'Share interesting and educational fun facts that surprise and delight.',
    icon: '🎯',
    requiresTopic: true
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Create step-by-step guides and how-to videos.',
    icon: '📝',
    requiresTopic: true
  },
  {
    id: 'news',
    name: 'News Summary',
    description: 'Summarize news stories and current events in an engaging way.',
    icon: '📰',
    requiresTopic: true
  },
  {
    id: 'comedy',
    name: 'Comedy Sketch',
    description: 'Generate humorous scripts for entertaining short videos.',
    icon: '😂',
    requiresTopic: true
  }
];

const durationOptions = [
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '90', label: '1.5 minutes' },
  { value: '120', label: '2 minutes' }
];

export function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState({
    topic: '',
    style: 'dark',
    tone: 'suspenseful',
    duration: '60'
  });

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setError(null);
    setGeneratedScript(null);
    setCustomizations(prev => ({
      ...prev,
      topic: '',
      style: template.id === 'scary-stories' ? 'dark' : 'casual',
      tone: template.id === 'scary-stories' ? 'suspenseful' : 'engaging'
    }));
  };

  const handleDurationSelect = (duration: string) => {
    setSelectedDuration(duration);
    setError(null);
  };

  const handleContinue = () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (!selectedDuration) {
      setError('Please select a duration');
      return;
    }

    if (selectedTemplate.requiresTopic && !topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    // Redirect to script generation page with parameters
    const searchParams = new URLSearchParams({
      template: selectedTemplate.id,
      duration: selectedDuration
    });

    if (topic) {
      searchParams.append('topic', topic);
    }

    window.location.href = `/script-generation?${searchParams.toString()}`;
  };

  const handleVoiceSelect = async (voiceId: string, voiceName: string) => {
    try {
      // Here you would typically call your API to generate the voiceover
      // and then proceed with video generation
      console.log('Selected voice:', voiceId, voiceName);
      
      // For now, just show an alert
      alert(`Voice selected: ${voiceName}! In a real implementation, this would generate the voiceover and proceed with video creation.`);
    } catch (error) {
      console.error('Error generating voiceover:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate voiceover');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
          Create Amazing Videos with AI
        </h1>
        <p className="text-xl text-gray-600">
          Transform your ideas into engaging videos using AI-powered tools. Choose from our templates or create your own custom content.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Choose Your Template</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => handleTemplateClick(template)}
            >
              <div className="text-4xl mb-3">{template.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{template.name}</h3>
              <p className="text-gray-600">{template.description}</p>
            </div>
          ))}
        </div>

        {selectedTemplate && (
          <div className="space-y-8 bg-gray-50 p-6 rounded-xl">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Select Duration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      selectedDuration === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => handleDurationSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedTemplate.requiresTopic && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Enter Topic</h3>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your topic..."
                  className="w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Continue to Script Generation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Voice Selection */}
      {generatedScript && (
        <VoiceSelector
          onVoiceSelect={handleVoiceSelect}
        />
      )}
    </div>
  );
} 