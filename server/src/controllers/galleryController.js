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
