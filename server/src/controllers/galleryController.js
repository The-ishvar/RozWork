import GalleryItem from '../models/GalleryItem.js'

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const serializeGalleryItem = (item) => ({
  id: item._id ? item._id.toString() : item.id,
  title: item.title,
  description: item.description || '',
  category: item.category || 'Featured',
  imageUrl: item.imageUrl,
  imageAlt: item.imageAlt || item.title,
  location: item.location || '',
  tags: item.tags || [],
  featured: !!item.featured,
  status: item.status || 'published',
  authorName: item.authorName || '',
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

const defaultGallery = [
  {
    title: 'Verified worker showcase',
    description: 'A polished collection of completed jobs from trusted professionals in the RozWork network.',
    category: 'Showcase',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Professional workers collaborating at a site',
    location: 'Mumbai',
    tags: ['verified', 'workers', 'portfolio'],
    featured: true,
    status: 'published',
  },
  {
    title: 'On-site maintenance work',
    description: 'High-trust service stories captured from recent bookings and approved completions.',
    category: 'Maintenance',
    imageUrl: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Technician performing maintenance work',
    location: 'Delhi',
    tags: ['maintenance', 'verification'],
    featured: true,
    status: 'published',
  },
  {
    title: 'Weekend labour support',
    description: 'Flexible support crews ready for short-term and urgent field assignments.',
    category: 'Labour',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Team of workers preparing site equipment',
    location: 'Bengaluru',
    tags: ['labour', 'urgent'],
    featured: false,
    status: 'published',
  },
]

export const getGallery = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim()
    const category = String(req.query.category || '').trim()
    const featuredOnly = String(req.query.featured || '').toLowerCase() === 'true'

    const filter = { status: 'published' }
    if (query) {
      filter.$or = [
        { title: { $regex: escapeRegExp(query), $options: 'i' } },
        { description: { $regex: escapeRegExp(query), $options: 'i' } },
        { tags: { $in: [new RegExp(escapeRegExp(query), 'i')] } },
      ]
    }
    if (category) {
      filter.category = { $regex: `^${escapeRegExp(category)}$`, $options: 'i' }
    }
    if (featuredOnly) {
      filter.featured = true
    }

    const items = await GalleryItem.find(filter).sort({ featured: -1, createdAt: -1 }).lean()

    if (items.length === 0) {
      const seededItems = await GalleryItem.create(defaultGallery)
      return res.json({ gallery: seededItems.map(serializeGalleryItem) })
    }

    return res.json({ gallery: items.map(serializeGalleryItem) })
  } catch (error) {
    console.error('gallery.list failed', error)
    next(error)
  }
}

export const createGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.create({
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category || 'Featured',
      imageUrl: req.body.imageUrl,
      imageAlt: req.body.imageAlt || req.body.title || '',
      location: req.body.location || '',
      tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [],
      featured: !!req.body.featured,
      status: req.body.status || 'published',
      createdBy: req.user?.id || null,
      authorName: req.user?.name || req.body.authorName || '',
    })

    return res.status(201).json({ galleryItem: serializeGalleryItem(item) })
  } catch (error) {
    console.error('gallery.create failed', error)
    next(error)
  }
}

export const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' })
    }

    Object.assign(item, {
      title: req.body.title || item.title,
      description: req.body.description ?? item.description,
      category: req.body.category || item.category,
      imageUrl: req.body.imageUrl || item.imageUrl,
      imageAlt: req.body.imageAlt ?? item.imageAlt,
      location: req.body.location ?? item.location,
      tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : item.tags,
      featured: req.body.featured !== undefined ? !!req.body.featured : item.featured,
      status: req.body.status || item.status,
      authorName: req.body.authorName || item.authorName,
    })
    await item.save()

    return res.json({ galleryItem: serializeGalleryItem(item) })
  } catch (error) {
    console.error('gallery.update failed', error)
    next(error)
  }
}

export const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' })
    }

    await item.deleteOne()
    return res.json({ success: true })
  } catch (error) {
    console.error('gallery.delete failed', error)
    next(error)
  }
}

export default { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem }
