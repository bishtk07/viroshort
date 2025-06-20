import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

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
      case 'subscription.renewed': {
        const subscription = data;
        const customerId = subscription.customer_id;
        const status = subscription.status;
        const items = subscription.items || [];
        
        // Get user by paddle customer ID
        const { data: userData, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('paddle_customer_id', customerId)
          .single();

        if (userError || !userData) {
          console.error('User not found for customer:', customerId);
          return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const userId = userData.user_id;

        // Get the plan details from the subscription items
        if (items.length > 0) {
          const priceId = items[0].price.id;
          
          // Get plan details from subscription_plans table
          const { data: planData, error: planError } = await supabase
            .from('subscription_plans')
            .select('name, credits_included, price_weekly, price_monthly')
            .or(`paddle_price_id_monthly.eq.${priceId},paddle_price_id_weekly.eq.${priceId}`)
            .single();

          if (!planError && planData) {
            const isWeeklyPlan = items[0].price.billing_cycle?.interval === 'week';
            const creditsToGrant = planData.credits_included;

            // Grant credits based on plan
            const { data: grantResult, error: grantError } = await supabase
              .rpc('grant_credits', {
                p_user_id: userId,
                p_amount: creditsToGrant,
                p_description: `${planData.name} plan ${event_type === 'subscription.renewed' ? 'renewal' : 'activation'}`,
                p_plan_type: planData.name.toLowerCase(),
                p_metadata: {
                  paddle_subscription_id: subscription.id,
                  paddle_price_id: priceId,
                  billing_cycle: isWeeklyPlan ? 'weekly' : 'monthly',
                  event_type: event_type
                }
              });

            if (grantError) {
              console.error('Error granting credits:', grantError);
            } else {
              console.log(`✅ Granted ${creditsToGrant} credits to user ${userId} for ${planData.name} plan`);
            }

            // Update user_credits table with plan details
            const { error: updateError } = await supabase
              .from('user_credits')
              .update({
                plan_type: planData.name.toLowerCase(),
                is_weekly_plan: isWeeklyPlan,
                weekly_limit: isWeeklyPlan ? planData.credits_included : null,
                monthly_limit: !isWeeklyPlan ? planData.credits_included : null,
                subscription_id: subscription.id,
                subscription_status: status,
                billing_cycle_start: subscription.current_billing_period?.starts_at,
                billing_cycle_end: subscription.current_billing_period?.ends_at,
                can_download: planData.name !== 'Free',
                can_fullscreen: planData.name !== 'Free',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);

            if (updateError) {
              console.error('Error updating user credits:', updateError);
            }
          }
        }

        // Update user_subscriptions table
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            status: status,
            paddle_subscription_id: subscription.id,
            current_period_start: subscription.current_billing_period?.starts_at,
            current_period_end: subscription.current_billing_period?.ends_at,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (subError) {
          console.error('Error updating subscription:', subError);
        }

        break;
      }

      case 'subscription.canceled':
      case 'subscription.expired': {
        const subscription = data;
        const customerId = subscription.customer_id;

        // Get user by paddle customer ID
        const { data: userData, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('paddle_customer_id', customerId)
          .single();

        if (!userError && userData) {
          // Update subscription status
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);

          // Update user credits to reflect canceled status
          await supabase
            .from('user_credits')
            .update({
              subscription_status: event_type === 'subscription.expired' ? 'expired' : 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);

          console.log(`❌ Subscription ${event_type} for user ${userData.user_id}`);
        }
        break;
      }

      case 'transaction.completed': {
        // Log successful payments
        const transaction = data;
        console.log(`💰 Payment completed: ${transaction.id} - ${transaction.details.totals.total}`);
        
        // Create billing history record
        if (transaction.customer_id) {
          const { data: userData } = await supabase
            .from('user_subscriptions')
            .select('user_id, id')
            .eq('paddle_customer_id', transaction.customer_id)
            .single();

          if (userData) {
            await supabase
              .from('billing_history')
              .insert({
                user_id: userData.user_id,
                subscription_id: userData.id,
                paddle_transaction_id: transaction.id,
                amount: transaction.details.totals.total / 100, // Convert from cents
                currency: transaction.currency_code,
                status: 'completed',
                billing_period_start: transaction.billing_period?.starts_at,
                billing_period_end: transaction.billing_period?.ends_at
              });
          }
        }
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