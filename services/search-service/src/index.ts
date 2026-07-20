import express from 'express'
import multer from 'multer'
import { fuzzySearch, initSearchEngine, autoComplete } from './search/textSearch'
import { searchByImage } from './search/imageSearch'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })
const PORT = process.env.SEARCH_SERVICE_PORT || 3003

app.use(express.json())

initSearchEngine()
setInterval(initSearchEngine, 5 * 60 * 1000)

app.get('/search', (req, res) => {
  const { q, category, brand, minPrice, maxPrice, vehicleType, limit } = req.query

  if (!q && !category && !brand) {
    return res.json([])
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
})

app.get('/autocomplete', (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  const suggestions = autoComplete(q as string)
  res.json(suggestions)
})

app.post('/search/image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' })

  try {
    const results = await searchByImage(req.file.buffer)
    res.json({ results, query: 'image-search-results' })
  } catch (err) {
    res.status(500).json({ error: 'Image search failed' })
  }
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'search-service' }))

app.listen(PORT, () => {
  console.log(`[Search Service] running on port ${PORT}`)
})
