/**
 * Search Service — provides hybrid text search (Fuse.js + TF-IDF),
 * autocomplete (Trie), and image search (CLIP + IVF vectors).
 * Re-indexes products from product-service every 5 minutes to stay current.
 */
import express from 'express'
import multer from 'multer'
import { fuzzySearch, initSearchEngine, autoComplete } from './search/textSearch'
import { searchByImage, getIndexStats } from './search/imageSearch'

const app = express()
// Multer configured for in-memory storage — images are processed immediately,
// never written to disk. 5MB limit prevents abuse.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
      return
    }
    cb(null, true)
  },
})
const PORT = process.env.SEARCH_SERVICE_PORT || 3003

app.use(express.json())

/** Standardised error envelope — consistent across all AutoMart services. */
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// Build the in-memory search index at startup, then refresh every 5 minutes
// to pick up new/updated products from the product service.
initSearchEngine()
setInterval(initSearchEngine, 5 * 60 * 1000)

// ─── GET /search ───────────────────────────────────────────────────────────────
// Hybrid text search combining Fuse.js (fuzzy matching for typos) with
// TF-IDF (term frequency scoring for relevance). Results are post-filtered
// by category, brand, price range, and vehicle type.
app.get('/search', (req, res) => {
  try {
    const { q, category, brand, minPrice, maxPrice, vehicleType, limit } = req.query

    // Return empty if no search criteria provided — prevents unbounded results
    if (!q && !category && !brand) {
      return res.json([])
    }

    // Validate price range
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice as string)
      const max = parseFloat(maxPrice as string)
      if (isNaN(min) || isNaN(max)) {
        return errorResponse(res, 400, 'SEARCH_INVALID_PRICE',
          `Invalid price range: minPrice="${minPrice}" and maxPrice="${maxPrice}" are not valid numbers.`,
          'Provide numeric values for minPrice and maxPrice (e.g. ?minPrice=10&maxPrice=100).')
      }
      if (min > max) {
        return errorResponse(res, 400, 'SEARCH_PRICE_RANGE_INVALID',
          `minPrice (${min}) cannot be greater than maxPrice (${max}).`,
          'Swap the values or set minPrice <= maxPrice.')
      }
    }

    const results = fuzzySearch({
      query: (q as string) || '',
      category: category as string,
      brand: brand as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      vehicleType: vehicleType as string,
      limit: limit ? parseInt(limit as string) : undefined,
    })

    res.json(results)
  } catch (err) {
    console.error('[Search] Fuzzy search error:', err)
    return errorResponse(res, 500, 'SEARCH_FAILED',
      'An unexpected error occurred during search.',
      'Check search-service logs. The product data index may need to be refreshed.')
  }
})

// ─── GET /autocomplete ─────────────────────────────────────────────────────────
// Returns prefix-based suggestions from the Trie index. Falls back to
// Fuse.js fuzzy search if the Trie has no matches (handles mid-word queries).
app.get('/autocomplete', (req, res) => {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string') return res.json([])

    const suggestions = autoComplete(q)
    res.json(suggestions)
  } catch (err) {
    console.error('[Search] Autocomplete error:', err)
    return errorResponse(res, 500, 'AUTOCOMPLETE_FAILED',
      'An unexpected error occurred during autocomplete.',
      'Check search-service logs.')
  }
})

// ─── POST /search/image ────────────────────────────────────────────────────────
// Accepts an image upload, generates a CLIP embedding, and searches the
// IVF vector index for visually similar products. Requires multipart/form-data.
app.post('/search/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'SEARCH_NO_IMAGE',
        'No image file was provided in the request.',
        'Attach an image file using multipart/form-data with the field name "image". Max size: 5MB.')
    }

    const results = await searchByImage(req.file.buffer)
    res.json({ results, query: 'image-search-results' })
  } catch (err: any) {
    if (err.message === 'Only image files are allowed') {
      return errorResponse(res, 415, 'SEARCH_UNSUPPORTED_IMAGE_TYPE',
        'The uploaded file is not a supported image format.',
        'Upload a JPEG, PNG, or WebP image file.')
    }
    console.error('[Search] Image search error:', err)
    return errorResponse(res, 500, 'SEARCH_IMAGE_FAILED',
      'Image-based search failed. The image processing pipeline may be unavailable.',
      'Check search-service logs and ensure the image search backend is configured.')
  }
})

// Multer error handler — catches file size limits and invalid uploads
// before they reach the route handler. Placed after routes so Express
// knows to forward multer errors here.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 413, 'SEARCH_IMAGE_TOO_LARGE',
        'The uploaded image exceeds the 5MB size limit.',
        'Compress or resize the image to under 5MB before uploading.')
    }
    return errorResponse(res, 400, 'SEARCH_UPLOAD_ERROR',
      `File upload error: ${err.message}`,
      'Try uploading again with a valid image file.')
  }
  next(err)
})

// ─── GET /search/image/stats ───────────────────────────────────────────────────
app.get('/search/image/stats', (_req, res) => {
  res.json(getIndexStats())
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'search-service' }))

app.listen(PORT, () => {
  console.log(`[Search Service] running on port ${PORT}`)
})
