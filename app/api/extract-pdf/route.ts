import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
const PDFParser = require('pdf2json')
import { promisify } from 'util'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    console.log('Extracting text from PDF using pdf2json...')

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse PDF using pdf2json
    const pdfParser = new PDFParser()
    
    // Create promise wrapper for parsing
    const parsePDF = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        let fullText = ''
        
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          console.error('PDF parsing error:', errData.parserError)
          reject(new Error('Failed to parse PDF'))
        })
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            // Extract text from parsed data
            if (pdfData && pdfData.Pages) {
              for (const page of pdfData.Pages) {
                if (page.Texts) {
                  for (const textObj of page.Texts) {
                    if (textObj.R) {
                      for (const run of textObj.R) {
                        if (run.T) {
                          try {
                            fullText += decodeURIComponent(run.T) + ' '
                          } catch (decodeError) {
                            // If URI decoding fails, use the raw text
                            fullText += run.T + ' '
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            resolve(fullText.trim())
          } catch (err) {
            reject(err)
          }
        })
        
        // Parse the buffer
        pdfParser.parseBuffer(buffer)
      })
    }
    
    try {
      const fullText = await parsePDF()

      console.log('Extracted text length:', fullText.length)
      console.log('First 300 characters:', fullText.substring(0, 300))

      if (!fullText || fullText.trim().length < 50) {
        return NextResponse.json({ 
          error: 'Could not extract readable text from PDF. The PDF might be image-based or corrupted.' 
        }, { status: 400 })
      }

      // Call Supabase Edge Function to parse the extracted text
      console.log('Calling Edge Function with extracted text...')
      console.log('Text length being sent:', fullText.trim().length)
      
      // Add timeout protection and retry logic
      const callEdgeFunction = async (retryCount = 0): Promise<any> => {
        try {
          const { data, error } = await supabase.functions.invoke('extract-profile-from-pdf', {
            body: { 
              pdfText: fullText.trim().substring(0, 8000) // Limit text to prevent timeouts
            }
          })

          if (error) {
            console.error(`Edge function error (attempt ${retryCount + 1}):`, error)
            
            // If it's a timeout or connection error and we haven't retried, try again
            if (retryCount === 0 && (
              error.message?.includes('stream closed') ||
              error.message?.includes('broken pipe') ||
              error.message?.includes('timeout') ||
              error.message?.includes('fetch failed')
            )) {
              console.log('Retrying Edge Function call...')
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
              return callEdgeFunction(1)
            }
            
            throw new Error(error.message || 'Failed to process extracted text with AI')
          }

          return data
        } catch (funcError: any) {
          if (retryCount === 0 && (
            funcError.message?.includes('stream closed') ||
            funcError.message?.includes('broken pipe') ||
            funcError.message?.includes('timeout')
          )) {
            console.log('Retrying Edge Function call after error...')
            await new Promise(resolve => setTimeout(resolve, 1000))
            return callEdgeFunction(1)
          }
          throw funcError
        }
      }

      const data = await callEdgeFunction()

      console.log('Edge function response:', data)
      return NextResponse.json({ data })

    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      return NextResponse.json({ 
        error: 'Failed to parse PDF. Please ensure the file is a valid PDF document.' 
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('PDF processing error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process PDF. Please try again.' 
    }, { status: 500 })
  }
}