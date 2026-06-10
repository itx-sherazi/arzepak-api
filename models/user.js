const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true },
    phone:      { type: String },
    password:   { type: String, required: true, minlength: 6 },
    role:       { type: String, enum: ['USER', 'DEALER', 'ADMIN'], default: 'USER' },
    avatar:     { type: String },
    isVerified: { type: Boolean, default: false },
    isBanned:   { type: Boolean, default: false },
       resetPasswordToken: { type: String },
      resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = bcrypt.hashSync(this.password, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret.password; return ret; },
});

module.exports = mongoose.model('User', userSchema);
