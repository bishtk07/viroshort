import React, { useState } from 'react';
// @ts-ignore
import { motion } from 'framer-motion';
// @ts-ignore
import { Video, Mic, Palette, Globe, Clock, ChevronRight } from 'lucide-react';

interface VideoSettings {
  destination: string;
  template: string;
  narrationStyle: string;
  artStyle: string;
  language: string;
  duration: string;
}

const artStyles = [
  { id: 1, url: '/art-style-1.jpg', name: 'Modern', icon: '🎨' },
  { id: 2, url: '/art-style-2.jpg', name: 'Vintage', icon: '🖼️' },
  { id: 3, url: '/art-style-3.jpg', name: 'Minimal', icon: '⚪' },
  { id: 4, url: '/art-style-4.jpg', name: 'Bold', icon: '💫' },
  { id: 5, url: '/art-style-5.jpg', name: 'Artistic', icon: '🎭' }
];

const FormSection: React.FC<{
  step: number;
  title: string;
  children: React.ReactNode;
}> = ({ step, title, children }) => (
  <motion.div
    className="space-y-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: step * 0.1 }}
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
        {step}
      </div>
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
    </div>
    <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
      {children}
    </div>
  </motion.div>
);

export const VideoCreationForm: React.FC = () => {
  const [settings, setSettings] = useState<VideoSettings>({
    destination: '',
    template: '',
    narrationStyle: 'Natural',
    artStyle: 'Modern',
    language: 'English',
    duration: '60 to 90 seconds'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSeries = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated API call
      console.log('Creating series with settings:', settings);
    } catch (error) {
      console.error('Error creating series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
          CREATE A SERIES
        </h1>
        <p className="text-muted-foreground text-lg">
          Schedule a series of fabulous videos to post on auto-pilot
        </p>
      </motion.div>

      <FormSection step={1} title="Destination">
        <div className="space-y-3">
          <p className="text-muted-foreground">Select where your video series will be posted</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['YouTube', 'TikTok', 'Instagram'].map((platform) => (
              <motion.button
                key={platform}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSettings({...settings, destination: platform.toLowerCase()})}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${settings.destination === platform.toLowerCase()
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Video className="w-6 h-6 mb-2" />
                <span className="font-medium">{platform}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection step={2} title="Content">
        <div className="space-y-3">
          <p className="text-muted-foreground">Choose your video content template</p>
          <select 
            className="w-full bg-background text-foreground rounded-lg p-4 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={settings.template}
            onChange={(e) => setSettings({...settings, template: e.target.value})}
          >
            <option value="">Choose Template</option>
            <option value="travel">Travel Destinations</option>
            <option value="story">Random AI Story</option>
            <option value="facts">Fun Facts</option>
          </select>
        </div>
      </FormSection>

      <FormSection step={3} title="Series Settings">
        <div className="space-y-6">
          <p className="text-muted-foreground">Customize preferences for each video in your series</p>
          
          {/* Narration Style */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <Mic className="w-4 h-4" />
              Narration Style
            </label>
            <select 
              className="w-full bg-background text-foreground rounded-lg p-4 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={settings.narrationStyle}
              onChange={(e) => setSettings({...settings, narrationStyle: e.target.value})}
            >
              <option value="Natural">Natural</option>
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
            </select>
          </div>

          {/* Art Style */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <Palette className="w-4 h-4" />
              Art Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {artStyles.map((style) => (
                <motion.button
                  key={style.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({...settings, artStyle: style.name})}
                  className={`
                    aspect-square rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center
                    ${settings.artStyle === style.name 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <span className="text-3xl mb-2">{style.icon}</span>
                  <span className="text-sm font-medium">{style.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Video Language */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <Globe className="w-4 h-4" />
              Video Language
            </label>
            <select 
              className="w-full bg-background text-foreground rounded-lg p-4 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <Clock className="w-4 h-4" />
              Duration Preference
            </label>
            <select 
              className="w-full bg-background text-foreground rounded-lg p-4 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={settings.duration}
              onChange={(e) => setSettings({...settings, duration: e.target.value})}
            >
              <option value="60 to 90 seconds">60 to 90 seconds</option>
              <option value="30 to 60 seconds">30 to 60 seconds</option>
              <option value="90 to 120 seconds">90 to 120 seconds</option>
            </select>
          </div>
        </div>
      </FormSection>

      {/* Create Button */}
      <motion.div 
        className="pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button 
          className={`
            w-full flex items-center justify-center gap-2 
            bg-primary hover:bg-primary/90 text-primary-foreground
            font-semibold py-4 px-6 rounded-xl transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          onClick={handleCreateSeries}
          disabled={isLoading || !settings.destination || !settings.template}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              CREATE SERIES
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}; 