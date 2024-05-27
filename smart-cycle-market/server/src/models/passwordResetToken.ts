import { compare, genSalt, hash } from 'bcrypt';
import { Date, Schema, model } from 'mongoose';

// INTERFACES -------------------------------
interface PasswordResetTokenDocument extends Document {
  owner: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(password: string): Promise<boolean>;
}

// Verification token model ---------------
const schema = new Schema<PasswordResetTokenDocument, {}, Methods>({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600,
    default: Date.now,
  },
});

// hash token
schema.pre('save', async function (next) {
  if (this.isModified('token')) {
    const salt = await genSalt(10);
    this.token = await hash(this.token, salt);
  }
  next();
});

// compare hash token
schema.methods.compareToken = async function (token: string) {
  return await compare(token, this.token);
};

const PasswordResetTokenModel = model('PasswordResetToken', schema);
export default PasswordResetTokenModel;
