import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Return configuration that the browser extension can use
        const config = {
            baseUrl: process.env.NODE_ENV === 'production' 
                ? 'https://swiftletter.online' 
                : 'http://localhost:3001',
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        };

        return NextResponse.json(config);
    } catch (error) {
        console.error('Config API error:', error);
        return NextResponse.json(
            { error: 'Failed to get configuration' },
            { status: 500 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
        },
    });
}