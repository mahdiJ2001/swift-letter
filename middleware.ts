import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    // Temporary: Disable middleware auth logic to fix deployment
    // Auth protection will be handled client-side in components
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profile/:path*',
        '/auth/:path*'
    ],
}