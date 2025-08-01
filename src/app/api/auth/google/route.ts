import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// Update the log function to accept multiple arguments
const log = (...messages: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...messages);
  }
};

export async function POST(req: NextRequest) {
  try {
    // Validate adminAuth
    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized properly');
      return NextResponse.json(
        { error: 'Authentication service unavailable. Please try again later.' },
        { status: 500 }
      );
    }

    // Extract the ID token from the request body
    const { idToken } = await req.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      );
    }
    
    try {
      log('Verifying Google ID token');
      // Verify the ID token using Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      log('Token verified successfully for user:', decodedToken.uid);
      
      // Get the user record
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      
      // Return user information
      return NextResponse.json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
        },
        message: 'Authentication successful'
      });
    } catch (tokenError: any) {
      log('Token verification error:', tokenError);
      
      // Check for credential-related errors
      if (tokenError.code === 'app/invalid-credential' || tokenError.code === 'auth/invalid-credential') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Firebase credential error. Check your FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL environment variables.');
        }
        return NextResponse.json(
          { error: 'Authentication service configuration error. Please contact support.' },
          { status: 500 }
        );
      }
      
      // Check for invalid token
      if (tokenError.code === 'auth/invalid-id-token') {
        return NextResponse.json(
          { error: 'Invalid authentication token. Please try signing in again.' },
          { status: 401 }
        );
      }
      
      // Handle other token errors
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 401 }
      );
    }
    
  } catch (error: any) {
    log(`Error: ${error.message}`);
    return NextResponse.json(
      { 
        error: 'Failed to authenticate with Google. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// For Firebase Admin initialization message:
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Admin initialized successfully');
} 