import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface CreditInfo {
  credits_available: number;
  plan_type: string;
  monthly_limit: number;
  weekly_limit: number;
  is_weekly_plan: boolean;
}

export const CreditBalance: React.FC = () => {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchCredits();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCredits(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('check_user_credits', { p_user_id: user.id });

      if (error) throw error;

      setCredits({
        credits_available: data.credits_available || 0,
        plan_type: data.plan_type || 'free',
        monthly_limit: data.monthly_limit || 1,
        weekly_limit: data.weekly_limit || 1,
        is_weekly_plan: data.is_weekly_plan || false
      });
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="credit-balance-container">
        <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
      </div>
    );
  }

  if (error || !credits) {
    return null;
  }

  const isLowCredits = credits.credits_available <= 2;
  const isNoCredits = credits.credits_available === 0;

  return (
    <div className="credit-balance-container flex items-center gap-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isNoCredits ? 'bg-red-50 text-red-600' : 
        isLowCredits ? 'bg-yellow-50 text-yellow-700' : 
        'bg-green-50 text-green-700'
      }`}>
        <span className="text-lg">
          {isNoCredits ? '🚫' : isLowCredits ? '⚠️' : '✨'}
        </span>
        <span className="font-medium">
          {credits.credits_available} {credits.credits_available === 1 ? 'Credit' : 'Credits'}
        </span>
        <span className="text-sm opacity-75">
          ({credits.plan_type})
        </span>
      </div>
      
      {(isLowCredits || isNoCredits) && (
        <a
          href="/billing"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isNoCredits 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          {isNoCredits ? 'Upgrade Now' : 'Get More Credits'}
        </a>
      )}
    </div>
  );
}; 