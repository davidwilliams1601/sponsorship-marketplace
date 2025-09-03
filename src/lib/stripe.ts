import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Check if Stripe keys are configured
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY;

// Only initialize if keys are properly configured (not placeholder values)
const isStripeConfigured = publishableKey && 
  publishableKey.startsWith('pk_') && 
  secretKey && 
  secretKey.startsWith('sk_');

// Client-side Stripe instance
export const stripePromise = isStripeConfigured && publishableKey
  ? loadStripe(publishableKey)
  : null;

// Server-side Stripe instance
export const stripe = isStripeConfigured && secretKey
  ? new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

// Helper to check if Stripe is configured
export const isStripeReady = (): boolean => {
  return isStripeConfigured;
};

// Calculate platform fee (5%)
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * 0.05 * 100) / 100; // 5% fee, rounded to 2 decimal places
};

// Calculate amount that goes to club after platform fee
export const calculateClubAmount = (amount: number): number => {
  return amount - calculatePlatformFee(amount);
};

// Format currency for display
export const formatCurrency = (amount: number, currency: string = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Convert amount to Stripe's cents format
export const toStripeAmount = (amount: number): number => {
  return Math.round(amount * 100); // Convert to pence/cents
};

// Convert from Stripe's cents format
export const fromStripeAmount = (amount: number): number => {
  return amount / 100;
};