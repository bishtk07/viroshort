import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';

export default function CreditBalance() {
  const [credits, setCredits] = useState<number>(1);
  const [planType, setPlanType] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchCredits = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.id) {
          console.log('💰 No session, setting default credits');
          if (mounted) {
            setCredits(1);
            setLoading(false);
          }
          return;
        }

        console.log('💰 Getting credits from DATABASE for user:', session.user.id);

        // ✅ Use database function instead of localStorage
        const { data: creditData, error } = await supabase
          .rpc('check_user_credits', { p_user_id: session.user.id });

        if (error) {
          console.warn('💰 Database credit check failed:', error);
          // Fallback to localStorage if database fails
          const localCredits = localStorage.getItem('userCredits');
          const fallbackCredits = localCredits ? parseInt(localCredits) : 1;
          
          if (mounted) {
            setCredits(fallbackCredits);
            setPlanType('free');
            setLoading(false);
          }
          return;
        }

        if (creditData) {
          const dbCredits = creditData.credits_available || 0;
          const dbPlan = creditData.plan_type || 'free';
          
          console.log('✅ Database credits:', dbCredits, 'Plan:', dbPlan);
          
          if (mounted) {
            setCredits(dbCredits);
            setPlanType(dbPlan);
            setLoading(false);
            
            // Also sync to localStorage for offline usage
            localStorage.setItem('userCredits', dbCredits.toString());
          }
        } else {
          console.warn('💰 No credit data returned from database');
          if (mounted) {
            setCredits(1);
            setPlanType('free');
            setLoading(false);
          }
        }

      } catch (err) {
        console.error('💰 Error in database credit fetch:', err);
        if (mounted) {
          // Fallback to localStorage
          const localCredits = localStorage.getItem('userCredits');
          setCredits(localCredits ? parseInt(localCredits) : 1);
          setLoading(false);
        }
      }
    };

    fetchCredits();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('💰 Auth state changed:', event);
      fetchCredits();
    });

    // Listen for credit updates via custom event
    const handleCreditUpdate = (event: CustomEvent) => {
      console.log('💰 Credit update event received:', event.detail);
      if (event.detail && event.detail.credits !== undefined) {
        setCredits(event.detail.credits);
        localStorage.setItem('userCredits', event.detail.credits.toString());
      }
    };
    
    window.addEventListener('creditUpdate', handleCreditUpdate as EventListener);
    window.addEventListener('credits-updated', handleCreditUpdate as EventListener);

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
      window.removeEventListener('creditUpdate', handleCreditUpdate as EventListener);
      window.removeEventListener('credits-updated', handleCreditUpdate as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Credits:</span>
        <span className="animate-pulse bg-gray-200 h-5 w-8 rounded"></span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Credits:</span>
      <span className={`font-semibold ${credits > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600'}`}>
        {credits}
      </span>
      {credits === 0 && (
        <a 
          href="/billing" 
          className="text-xs text-blue-500 hover:text-blue-600 ml-1"
        >
          (upgrade)
        </a>
      )}
      <span className="text-xs text-gray-400">({planType})</span>
    </div>
  );
} 