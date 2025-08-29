import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  history: Array<{
    filename: string;
    createdAt: Date;
  }>
  isVerified:boolean;
  resetOTP:string|null;
  resetOTPExpires:Date|null;
  resetOTPVerified:boolean;
}
const HistoryItemSchema: Schema = new Schema({
  filename: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  bio: { type: String },
  history: [HistoryItemSchema],
  isVerified: { type: Boolean, default: false },
  resetOTP: { type: String ,default:null},
resetOTPExpires: { type: Date ,default:null},
resetOTPVerified: { type: Boolean, default: false },
});

export default mongoose.model<IUser>('User', UserSchema);
