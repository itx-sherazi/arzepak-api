import Post from "../model/Post.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "../config/cloudinary.js"; // Cloudinary import

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to extract Cloudinary public ID from URL
const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;
  let startIndex = uploadIndex + 1;
  if (parts[startIndex].match(/^v\d+$/)) {
    startIndex++;
  }
  const publicIdWithExt = parts.slice(startIndex).join("/");
  return publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf("."));
};

export const createPost = async (req, res) => {
  try {
    const { title, slug, body, tags, category, metaTitle, metaDescription, faqs } =
      req.body;
    let image = "";

    // Process tags and keywords as arrays first, to use them for image upload
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter((tag) => tag && tag.trim() !== "");
      } else if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== "");
      }
    }

    // Handle image upload with Cloudinary
    if (req.file) {
      try {
        let uploadOptions = {
          folder: "post",
          upload_preset: "firmo",
          timeout: 120000
        };

        if (processedTags && processedTags.length > 0) {
          let firstTag = processedTags[0];
          let tagSlug = firstTag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          if (tagSlug) {
            uploadOptions.public_id = tagSlug;
            uploadOptions.context = `alt=${firstTag}`;
          }
        }

        const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
        image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    if (!title || !body) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Title and body are required" });
    }

    // Let the model's pre-save hook handle slug generation
    const post = await Post.create({
      title,
      slug,
      body,
      image: image || "", // Save image path or empty string if no image
      tags: processedTags,
      category: category || "General",
      metaTitle,
      metaDescription,

      faqs: typeof faqs === "string" ? JSON.parse(faqs) : faqs || [],
    });


    res.status(200).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllPostsSitemap = async (req, res) => {
  try {
    // fetch only the needed fields for sitemap
    const posts = await Post.find()
      .select("slug createdAt") // only keep lightweight fields
      .sort({ createdAt: -1 }) // latest first
      .lean();

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No posts found for sitemap",
      });
    }

    // Add date field that maps to createdAt for frontend compatibility
    const postsWithDate = posts.map((post) => ({
      ...post,
      date: post.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: postsWithDate,
      total: postsWithDate.length,
    });
  } catch (error) {
    console.error("Sitemap Posts Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching posts for sitemap",
      error: error.message,
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // current page
    const limit = parseInt(req.query.limit) || 10; // posts per page
    const skip = (page - 1) * limit;

    // Count total posts for pagination
    const totalPosts = await Post.countDocuments();

    // Fetch posts with pagination & latest first
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .lean();

    // Add date field that maps to createdAt for frontend compatibility
    const postsWithDate = posts.map((post) => ({
      ...post,
      date: post.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: postsWithDate,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getLatestPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // latest first
      .limit(6);

    // Add date field that maps to createdAt for frontend compatibility
    const postsWithDate = posts.map((post) => ({
      ...post.toObject(),
      date: post.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Latest posts fetched successfully",
      data: postsWithDate,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ ok: false, message: "Post not found" });
    }

    // Add date field that maps to createdAt for frontend compatibility
    const postWithDate = {
      ...post.toObject(),
      date: post.createdAt,
    };

    res.status(200).json({ ok: true, data: postWithDate });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "Server error", error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Delete the cover image file if it exists
    if (post.image) {
      const publicId = getCloudinaryPublicId(post.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete cover image from Cloudinary:`, err);
        }
      } else {
        const imagePath = path.join(
          __dirname,
          "..",
          "uploads",
          "post",
          path.basename(post.image)
        );
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.error(`Failed to delete cover image: ${imagePath}`, err);
          }
        }
      }
    }

    // Delete images embedded in the body
    if (post.body) {
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;

      while ((match = imgRegex.exec(post.body)) !== null) {
        const imgSrc = match[1];

        const publicId = getCloudinaryPublicId(imgSrc);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error(`Failed to delete body image from Cloudinary:`, err);
          }
        } else if (imgSrc.includes("/uploads/post/")) {
          try {
            const filename = imgSrc.split("/uploads/post/").pop();
            if (filename) {
              const cleanFilename = filename.split("?")[0].split("#")[0];
              const bodyImagePath = path.join(
                __dirname,
                "..",
                "uploads",
                "post",
                cleanFilename
              );

              if (fs.existsSync(bodyImagePath)) {
                fs.unlinkSync(bodyImagePath);
              }
            }
          } catch (err) {
            console.error(`Failed to delete body image: ${imgSrc}`, err);
          }
        }
      }
    }

    // Delete the post from database
    await Post.findByIdAndDelete(req.params.id);

  

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "post",
      upload_preset: "firmo",
      timeout: 120000
    });
    fs.unlinkSync(req.file.path); // Clean up local file

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Error in uploadImage controller:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, body, tags, category, metaTitle, metaDescription, faqs } =
      req.body;

    const post = await Post.findById(id);
    if (!post) {
      // Clean up uploaded file if post not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Post not found" });
    }

    let image = post.image;
    console.log("Updating post with ID:", id);
    console.log("Initial image URL:", image);

    // Process tags and keywords as arrays
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter((tag) => tag && tag.trim() !== "");
      } else if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== "");
      }
    } else {
      processedTags = post.tags;
      if (tags === "") processedTags = [];
    }

    // Handle image upload
    if (req.file) {
      console.log("New image file received:", req.file.path);
      // Delete old image if it exists
      if (post.image && post.image.includes("res.cloudinary.com")) {
        const publicId = getCloudinaryPublicId(post.image);
        if (publicId) {
          try {
            console.log("Deleting old image from Cloudinary:", publicId);
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error(`Failed to delete old cover image from Cloudinary:`, err);
          }
        }
      } else if (post.image) {
        // Fallback for local files
        const oldImagePath = path.join(
          __dirname,
          "..",
          "uploads",
          "post",
          path.basename(post.image)
        );
        if (fs.existsSync(oldImagePath)) {
          try {
            console.log("Deleting old local image:", oldImagePath);
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.error(
              `Failed to delete old cover image: ${oldImagePath}`,
              err
            );
          }
        }
      }

      try {
        let uploadOptions = {
          folder: "post",
          upload_preset: "firmo",
          timeout: 120000
        };

        if (processedTags && processedTags.length > 0) {
          let firstTag = processedTags[0];
          let tagSlug = firstTag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          if (tagSlug) {
            uploadOptions.public_id = tagSlug;
            uploadOptions.context = `alt=${firstTag}`;
          }
        }

        const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
        image = result.secure_url;
        console.log("New image uploaded to Cloudinary:", image);
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // If upload fails, we still want to keep the old image unless we explicitly want to fail
        // In this case, we return a 500
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    // Update fields
    post.title = title || post.title;
    post.slug = slug || post.slug;
    post.body = body || post.body;

    post.image = image;
    post.tags = tags !== undefined ? processedTags : post.tags;
    post.category = category || post.category;
    post.metaTitle = metaTitle !== undefined ? metaTitle : post.metaTitle;
    post.metaDescription =
      metaDescription !== undefined ? metaDescription : post.metaDescription;

    if (faqs) {
      post.faqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs;
    }

    await post.save();

 
    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const publicId = getCloudinaryPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      return res.status(200).json({ message: "Image deleted successfully" });
    }

    // Output fallback for local images
    if (url.includes("/uploads/post/")) {
      const filename = url.split("/uploads/post/").pop();
      if (filename) {
        const cleanFilename = filename.split("?")[0].split("#")[0];
        const imagePath = path.join(
          __dirname,
          "..",
          "uploads",
          "post",
          cleanFilename
        );

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          return res
            .status(200)
            .json({ message: "Image deleted successfully" });
        } else {
          return res.status(404).json({ message: "Image file not found" });
        }
      }
    }

    res
      .status(400)
      .json({ message: "Invalid image URL or not hosted locally" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
