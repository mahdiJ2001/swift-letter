import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const zip = new JSZip();
        const extensionPath = path.join(process.cwd(), 'browser-extension');

        // Check if browser-extension directory exists
        if (!fs.existsSync(extensionPath)) {
            return NextResponse.json({ error: 'Extension files not found' }, { status: 404 });
        }

        // Function to add files recursively
        const addFilesToZip = (dirPath: string, zipFolder: JSZip) => {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Create folder and recurse
                    const folder = zipFolder.folder(file);
                    if (folder) {
                        addFilesToZip(fullPath, folder);
                    }
                } else {
                    // Add file
                    const content = fs.readFileSync(fullPath);
                    zipFolder.file(file, content);
                }
            }
        };

        // Add all extension files to zip
        addFilesToZip(extensionPath, zip);

        // Generate zip buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Return zip file
        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="swift-letter-extension.zip"',
                'Content-Length': zipBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Error creating extension zip:', error);
        return NextResponse.json({ error: 'Failed to create extension package' }, { status: 500 });
    }
}