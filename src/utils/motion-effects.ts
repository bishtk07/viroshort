interface MotionEffect {
  name: string;
  scale?: {
    start: number;
    end: number;
  };
  translate?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

const MOTION_EFFECTS: MotionEffect[] = [
  { name: 'zoomIn', scale: { start: 1, end: 1.2 } },
  { name: 'zoomOut', scale: { start: 1.2, end: 1 } },
  { name: 'panLeft', translate: { start: { x: 0, y: 0 }, end: { x: -50, y: 0 } } },
  { name: 'panRight', translate: { start: { x: -50, y: 0 }, end: { x: 0, y: 0 } } },
  { name: 'panUp', translate: { start: { x: 0, y: 0 }, end: { x: 0, y: -50 } } },
  { name: 'panDown', translate: { start: { x: 0, y: -50 }, end: { x: 0, y: 0 } } }
];

// Keywords that suggest different motion effects
const MOTION_KEYWORDS = {
  zoomIn: ['closer', 'focus', 'important', 'key', 'crucial', 'highlight', 'specific', 'detail'],
  zoomOut: ['broad', 'overall', 'generally', 'wide', 'expansive', 'entire', 'whole'],
  panLeft: ['before', 'previous', 'past', 'earlier', 'back', 'return'],
  panRight: ['next', 'future', 'forward', 'then', 'advance', 'proceed'],
  panUp: ['above', 'higher', 'rise', 'increase', 'grow', 'improve'],
  panDown: ['below', 'lower', 'decrease', 'down', 'reduce', 'fall']
};

// Sentiment keywords that might influence motion
const SENTIMENT_KEYWORDS = {
  dramatic: ['suddenly', 'dramatically', 'surprisingly', 'shocking'],
  gentle: ['slowly', 'gradually', 'gently', 'carefully'],
  energetic: ['quickly', 'rapidly', 'energetically', 'vigorously']
};

export function getMotionEffectForChunk(chunkText: string): MotionEffect {
  const text = chunkText.toLowerCase();
  
  // Check for motion keywords
  for (const [effect, keywords] of Object.entries(MOTION_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      const matchingEffect = MOTION_EFFECTS.find(e => e.name === effect);
      if (matchingEffect) {
        // Adjust effect based on sentiment
        return adjustEffectForSentiment(matchingEffect, text);
      }
    }
  }

  // If no specific keywords found, use sentiment to choose a default effect
  return getDefaultEffect(text);
}

function adjustEffectForSentiment(effect: MotionEffect, text: string): MotionEffect {
  const adjustedEffect = { ...effect };

  // Adjust scale or translation based on sentiment
  if (SENTIMENT_KEYWORDS.dramatic.some(keyword => text.includes(keyword))) {
    if (adjustedEffect.scale) {
      adjustedEffect.scale = {
        start: adjustedEffect.scale.start,
        end: adjustedEffect.scale.end * 1.5 // More dramatic scaling
      };
    }
    if (adjustedEffect.translate) {
      adjustedEffect.translate = {
        start: adjustedEffect.translate.start,
        end: {
          x: adjustedEffect.translate.end.x * 1.5,
          y: adjustedEffect.translate.end.y * 1.5
        }
      };
    }
  } else if (SENTIMENT_KEYWORDS.gentle.some(keyword => text.includes(keyword))) {
    if (adjustedEffect.scale) {
      adjustedEffect.scale = {
        start: adjustedEffect.scale.start,
        end: adjustedEffect.scale.start + (adjustedEffect.scale.end - adjustedEffect.scale.start) * 0.7
      };
    }
    if (adjustedEffect.translate) {
      adjustedEffect.translate = {
        start: adjustedEffect.translate.start,
        end: {
          x: adjustedEffect.translate.end.x * 0.7,
          y: adjustedEffect.translate.end.y * 0.7
        }
      };
    }
  }

  return adjustedEffect;
}

function getDefaultEffect(text: string): MotionEffect {
  // Choose default effect based on sentiment
  if (SENTIMENT_KEYWORDS.dramatic.some(keyword => text.includes(keyword))) {
    return MOTION_EFFECTS[0]; // zoomIn for dramatic
  } else if (SENTIMENT_KEYWORDS.gentle.some(keyword => text.includes(keyword))) {
    return MOTION_EFFECTS[1]; // zoomOut for gentle
  } else if (SENTIMENT_KEYWORDS.energetic.some(keyword => text.includes(keyword))) {
    return MOTION_EFFECTS[3]; // panRight for energetic
  }

  // Return random effect if no sentiment detected
  return MOTION_EFFECTS[Math.floor(Math.random() * MOTION_EFFECTS.length)];
}

export { MOTION_EFFECTS, type MotionEffect }; 