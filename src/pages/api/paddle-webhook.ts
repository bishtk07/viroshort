import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// Define plan credit mappings based on price IDs
const PLAN_CREDITS = {
  // Starter Plan - $19/month, 15 credits
  'pri_01jy2at6gfgcdcxt4dq94jb50z': { credits: 15, planType: 'starter' }, // Monthly
  'pri_01jy2at8bv9vr8fxq49kq4y3j6': { credits: 3, planType: 'starter' }, // Weekly (3 credits)
  
  // Daily Plan - $39/month, 30 credits
  'pri_01jy2atgsxxgm8wnhgdqhed9mq': { credits: 30, planType: 'daily' }, // Monthly
  'pri_01jy2atkp7mwc19kz6ybyjtxkc': { credits: 7, planType: 'daily' }, // Weekly (7 credits)
  
  // Hardcore Plan - $69/month, 60 credits
  'pri_01jy2atpsyh60aa8ahb1kmqym3': { credits: 60, planType: 'hardcore' }, // Monthly
  'pri_01jy2atqzv79317fs6bz3qacvn': { credits: 15, planType: 'hardcore' }, // Weekly (15 credits)
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    console.log('🎯 Paddle Webhook received:', body.event_type);
    
    // Verify webhook signature (add your webhook secret verification here)
    // const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    // ... verification logic ...

    const { event_type, data } = body;

    switch (event_type) {
      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.updated':
      case 'subscription.renewed':
      case 'transaction.completed': {
        const subscription = data.subscription || data;
        const transaction = data;
        
        // For transaction.completed events, we'll use transaction data
        const isTransaction = event_type === 'transaction.completed';
        const items = subscription.items || transaction.items || [];
        
        if (items.length === 0) {
          console.log('No items found in subscription/transaction');
          break;
        }

        // Get the price ID from the first item
        const priceId = items[0].price?.id;
        if (!priceId) {
          console.log('No price ID found in items');
          break;
        }

        // Get plan details from our credit mapping
        const planInfo = PLAN_CREDITS[priceId as keyof typeof PLAN_CREDITS];
        if (!planInfo) {
          console.log(`Unknown price ID: ${priceId}`);
          break;
        }

        // For transactions, we need to find the user by customer email
        // For subscriptions, we'll try to find by customer ID first
        let userAuthId = null;
        
        if (isTransaction && transaction.customer?.email) {
          // Find user by email from transaction
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          if (!authError && authUsers.users) {
            const user = authUsers.users.find(u => u.email === transaction.customer.email);
            if (user) {
              userAuthId = user.id;
            }
          }
        }
        
        if (!userAuthId) {
          console.log('Could not find user for this subscription/transaction');
          break;
        }

        console.log(`Processing ${event_type} for user ${userAuthId}, plan: ${planInfo.planType}, credits: ${planInfo.credits}`);

        // Update user subscription using our database function
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_user_subscription', {
            p_user_id: userAuthId,
            p_plan_type: planInfo.planType,
            p_subscription_status: 'active',
            p_paddle_subscription_id: subscription.id || transaction.subscription_id,
            p_credits_to_add: planInfo.credits
          });

        if (updateError) {
          console.error('Error updating user subscription:', updateError);
        } else {
          console.log(`✅ Updated user ${userAuthId} to ${planInfo.planType} plan with ${planInfo.credits} credits`);
        }

        break;
      }

      case 'subscription.canceled':
      case 'subscription.expired': {
        const subscription = data;
        
        // For now, just log these events
        // TODO: Implement cancellation logic when needed
        console.log(`❌ Subscription ${event_type}: ${subscription.id}`);
        break;
      }

      default:
        console.log(`🔔 Unhandled webhook event: ${event_type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 