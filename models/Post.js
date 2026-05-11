const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  slug:            { type: String, unique: true, index: true },
  body:            { type: String, required: true },
  image:           { type: String },
  tags:            [String],
  category:        { type: String, default: 'General', index: true },
  metaTitle:       { type: String },
  metaDescription: { type: String },
  faqs: [{ question: String, answer: String }],
}, { timestamps: true });

PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });

PostSchema.pre('save', function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

module.exports = mongoose.model('Post', PostSchema);
