import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  lastLogin: Date;
  isVerified: boolean;
  verificationToken: string | undefined;
  verificationTokenExpiresAt: Date | undefined;
  resetPasswordToken: string | undefined;
  resetPasswordExpiresAt: Date | undefined;
  accessToken: string | undefined;
  refreshToken: string | undefined;
  accessTokenExpires: Date | undefined;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    lastLogin: {
      type: Date,
      default: Date.now()
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    accessToken: String,
    accessTokenExpires: Date,
    refreshToken: String
  },
  { timestamps: true }
);


userSchema.pre("save", async function (this: IUser, next: (err?: Error) => void) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password! = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});


userSchema.methods['comparePassword'] = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password!);
  } catch (err: any) {
    throw err;
  }
};


const User = mongoose.model<IUser, Model<IUser>>("User", userSchema);

export { User, IUser };