/**
 * Stripe Payment Endpoints — Creates Checkout Sessions, handles webhooks.
 *
 * Flow:
 *   1. Frontend POST /payments/create-checkout → creates Stripe Checkout Session
 *   2. User redirected to Stripe-hosted checkout page → enters card details
 *   3. Stripe sends webhook to /payments/webhook → we update order status
 *   4. User redirected to /checkout/success → order confirmed
 *
 * Test cards:
 *   4242 4242 4242 4242 — always succeeds
 *   4000 0000 0000 0002 — always fails
 */
import { Router, Request, Response } from 'express'
import Stripe from 'stripe'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil' as any,
})

// Base URL for redirects (frontend)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3080'
// Base URL for webhook callbacks (backend)
const API_URL = process.env.API_URL || 'http://localhost:3000'

/**
 * POST /payments/create-checkout
 * Creates a Stripe Checkout Session and returns the session URL.
 * Frontend redirects user to this URL to complete payment.
 */
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    const { items, orderId, total, address, phone } = req.body

    if (!items?.length || !orderId || !total) {
      return res.status(400).json({
        code: 'PAYMENT_MISSING_FIELDS',
        message: 'Missing required fields: items, orderId, total.',
        hint: 'Provide items array, orderId, and total in the request body.',
      })
    }

    // Build Stripe line items from cart items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.qty,
    }))

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${FRONTEND_URL}/checkout?cancelled=true`,
      metadata: {
        orderId,
        userId: req.headers.authorization?.split(' ')[1] || 'anonymous',
      },
      // Shipping address collection (optional)
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'IN'],
      },
      // Customer email (prefill if available)
      ...(req.body.email ? { customer_email: req.body.email } : {}),
    })

    res.json({
      sessionId: session.id,
      url: session.url, // Frontend can redirect to this URL
    })
  } catch (err: any) {
    console.error('[Payment] Create checkout error:', err.message)
    res.status(500).json({
      code: 'PAYMENT_SESSION_FAILED',
      message: 'Failed to create Stripe checkout session.',
      hint: 'Check STRIPE_SECRET_KEY is valid. Stripe error: ' + err.message,
    })
  }
})

/**
 * POST /payments/webhook
 * Stripe sends events here. We listen for checkout.session.completed
 * to mark orders as paid.
 *
 * IMPORTANT: This route must use raw body (not JSON parsed) for
 * Stripe signature verification to work.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  if (!webhookSecret || webhookSecret === 'whsec_...') {
    // Webhook not configured — skip verification for dev
    console.warn('[Payment] Stripe webhook secret not configured — skipping signature verification')
    const event = req.body
    await handleWebhookEvent(event)
    return res.json({ received: true })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body, // Raw body
      sig,
      webhookSecret
    )
    await handleWebhookEvent(event)
    res.json({ received: true })
  } catch (err: any) {
    console.error('[Payment] Webhook signature verification failed:', err.message)
    res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }
})

/**
 * Handles Stripe webhook events.
 */
async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId
      console.log(`[Payment] Checkout completed for order ${orderId}, session ${session.id}`)
      // In a real app, you'd update the order status in the database here
      // For demo purposes, we just log it — the frontend already creates the order
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      console.log(`[Payment] Payment failed for intent ${intent.id}`)
      break
    }
    default:
      console.log(`[Payment] Unhandled event type: ${event.type}`)
  }
}

/**
 * GET /payments/session/:sessionId
 * Retrieve a Checkout Session to check payment status.
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
    res.json({
      id: session.id,
      status: session.status, // 'open', 'complete', 'expired'
      payment_status: session.payment_status, // 'paid', 'unpaid', 'no_payment_required'
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
    })
  } catch (err: any) {
    console.error('[Payment] Session retrieve error:', err.message)
    res.status(404).json({
      code: 'PAYMENT_SESSION_NOT_FOUND',
      message: 'Stripe session not found.',
      hint: 'Verify the session ID is correct.',
    })
  }
})

export default router
