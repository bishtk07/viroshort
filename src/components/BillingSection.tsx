import React, { useState, useEffect } from 'react';

interface BillingSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Paddle: any;
  }
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  weeklyPrice: string;
  monthlyPriceId: string;
  weeklyPriceId: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
  credits: number;
  savings: string;
}

// SVG Icons
const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const ZapIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const CrownIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236l2.25 3.014M7.5 21.75V14.25" />
  </svg>
);

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for getting started',
    monthlyPrice: '19',
    weeklyPrice: '8',
    monthlyPriceId: 'pri_01jy2at6gfgcdcxt4dq94jb50z',
    weeklyPriceId: 'pri_01jy2at8bv9vr8fxq49kq4y3j6',
    credits: 50,
    savings: 'Save $13/month',
    icon: <StarIcon className="w-6 h-6" />,
    features: [
      { text: '50 video credits per month', included: true },
      { text: 'Basic AI voices', included: true },
      { text: 'Standard video quality', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced AI voices', included: false },
      { text: 'Priority processing', included: false },
    ],
  },
  {
    id: 'daily',
    name: 'Daily',
    description: 'For regular content creators',
    monthlyPrice: '39',
    weeklyPrice: '15',
    monthlyPriceId: 'pri_01jy2atgsxxgm8wnhgdqhed9mq',
    weeklyPriceId: 'pri_01jy2atkp7mwc19kz6ybyjtxkc',
    credits: 200,
    savings: 'Save $21/month',
    popular: true,
    icon: <ZapIcon className="w-6 h-6" />,
    features: [
      { text: '200 video credits per month', included: true },
      { text: 'Basic & Advanced AI voices', included: true },
      { text: 'HD video quality', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Custom voice cloning', included: true },
      { text: 'Batch processing', included: false },
    ],
  },
  {
    id: 'hardcore',
    name: 'Hardcore',
    description: 'For power users and agencies',
    monthlyPrice: '69',
    weeklyPrice: '26',
    monthlyPriceId: 'pri_01jy2atpsyh60aa8ahb1kmqym3',
    weeklyPriceId: 'pri_01jy2atqzv79317fs6bz3qacvn',
    credits: 500,
    savings: 'Save $35/month',
    icon: <CrownIcon className="w-6 h-6" />,
    features: [
      { text: '500 video credits per month', included: true },
      { text: 'All AI voices & features', included: true },
      { text: '4K video quality', included: true },
      { text: 'Priority support & chat', included: true },
      { text: 'Custom voice cloning', included: true },
      { text: 'Batch processing', included: true },
    ],
  },
];

export default function BillingSection({ isOpen, onClose }: BillingSectionProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('BillingSection opened, initializing Paddle...');
      // Initialize Paddle when component opens
      if (window.Paddle) {
        try {
          window.Paddle.Environment.set('production'); // Use production environment
          
          // Get the client token from the environment
          const clientToken = import.meta.env.PUBLIC_PADDLE_CLIENT_TOKEN;
          
          if (!clientToken) {
            throw new Error('Paddle client token not found in environment variables');
          }
          
          window.Paddle.Initialize({
            token: clientToken, // Use the token from environment variable
            eventCallback: function(data: any) {
              console.log('Paddle event:', data);
              
              if (data.name === 'checkout.completed') {
                // Redirect to success page with plan information
                const plan = data.data?.custom_data?.planName || 'unknown';
                const period = data.data?.custom_data?.billingPeriod || 'monthly';
                window.location.href = `/success?plan=${plan}&period=${period}`;
              } else if (data.name === 'checkout.closed') {
                console.log('Checkout was closed');
                setIsLoading(null); // Reset loading state
              } else if (data.name === 'checkout.error') {
                console.error('Checkout error:', data.error);
                setIsLoading(null); // Reset loading state
                alert('There was an error processing your payment. Please try again.');
              }
            }
          });
          console.log('✅ Paddle initialized successfully in BillingSection');
        } catch (error) {
          console.error('❌ Error initializing Paddle in BillingSection:', error);
        }
      } else {
        console.error('❌ Paddle SDK not available in BillingSection');
      }
    }
  }, [isOpen]);

  const handleUpgrade = async (plan: Plan) => {
    if (!window.Paddle) {
      console.error('Paddle not loaded');
      alert('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    console.log('Upgrading to plan:', plan.name, 'Period:', billingPeriod);
    setIsLoading(plan.id);

    try {
      const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.weeklyPriceId;
      console.log('Using price ID:', priceId);
      
      await window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en'
        },
        customData: {
          planName: plan.name,
          credits: plan.credits.toString(),
          billingPeriod,
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error opening the checkout. Please try again.');
      setIsLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-2">Select the perfect plan for your video creation needs</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            >
              ×
            </button>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('weekly')}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  billingPeriod === 'weekly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border-2 p-6 ${
                  plan.popular
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                } transition-all duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex justify-center items-center mb-3">
                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {plan.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.weeklyPrice}
                      </span>
                      <span className="text-gray-600 ml-1">
                        /{billingPeriod === 'monthly' ? 'month' : 'week'}
                      </span>
                    </div>
                    {billingPeriod === 'monthly' && (
                      <p className="text-green-600 text-sm font-medium mt-1">{plan.savings}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isLoading === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  } ${isLoading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading === plan.id ? 'Loading...' : 'Upgrade Now'}
                </button>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckIcon
                        className={`w-5 h-5 mr-3 ${
                          feature.included ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Choose ViroShort?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ZapIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600 text-sm">Generate professional videos in minutes, not hours</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">High Quality</h4>
                <p className="text-gray-600 text-sm">AI-powered content that looks and sounds professional</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy to Use</h4>
                <p className="text-gray-600 text-sm">No video editing experience required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 