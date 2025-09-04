import { NextRequest, NextResponse } from 'next/server';
import { stripe, toStripeAmount, calculatePlatformFee } from '@/lib/stripe';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { sponsorshipId, businessId } = await request.json();

    if (!sponsorshipId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch sponsorship details
    const sponsorshipDoc = await getDoc(doc(db, 'sponsorships', sponsorshipId));
    if (!sponsorshipDoc.exists()) {
      return NextResponse.json(
        { error: 'Sponsorship not found' },
        { status: 404 }
      );
    }

    const sponsorship = sponsorshipDoc.data();
    const amount = sponsorship.amount;
    const platformFee = calculatePlatformFee(amount);

    // Fetch business details
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    if (!businessDoc.exists()) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const business = businessDoc.data();

    // Create payment intent with platform fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeAmount(amount),
      currency: 'gbp',
      application_fee_amount: toStripeAmount(platformFee),
      metadata: {
        sponsorshipId,
        businessId,
        clubId: sponsorship.clubId,
        sponsorshipTitle: sponsorship.title,
        businessName: business.name,
        platformFee: platformFee.toString(),
      },
      receipt_email: business.email,
      description: `Sponsorship: ${sponsorship.title}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      platformFee,
      clubAmount: amount - platformFee,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}