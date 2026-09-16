import Product from '../models/Product.js';
import User from '../models/User.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, category, minPrice, maxPrice } = req.query;
    const filter = {};

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    const enriched = await Promise.all(products.map(async (p) => {
      const seller = p.sellerId ? await User.findById(p.sellerId).select('name email').lean() : null;
      return {
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        category: p.category,
        price: p.price,
        status: p.status,
        featured: p.featured,
        sellerId: p.sellerId?.toString() || '',
        sellerName: seller?.name || p.sellerName || 'Unknown',
        stock: p.stock,
        sold: p.sold,
        ratings: p.ratings,
        views: p.views,
        createdAt: p.createdAt,
      };
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const seller = product.sellerId ? await User.findById(product.sellerId).select('name email phone').lean() : null;
    res.json({ success: true, data: { ...product.toObject(), id: product._id.toString(), seller } });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: { id: product._id.toString() }, message: 'Product created successfully' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: { id: product._id.toString() }, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'active', isApproved: true, approvedAt: new Date(), approvedBy: req.user.id },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: { id: product._id.toString(), status: product.status }, message: 'Product approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', isApproved: false, rejectionReason: reason || '' },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: { id: product._id.toString(), status: product.status }, message: 'Product rejected successfully' });
  } catch (error) {
    next(error);
  }
};

export const feature = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { featured: req.body.featured ?? true },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: { id: product._id.toString(), featured: product.featured }, message: `Product ${product.featured ? 'featured' : 'unfeatured'} successfully` });
  } catch (error) {
    next(error);
  }
};
