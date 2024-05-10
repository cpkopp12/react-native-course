import { compare, genSalt, hash } from 'bcrypt';
import { Date, Schema, model } from 'mongoose';

// INTERFACES -------------------------------
interface AuthVerificationTokenDocument extends Document {
  owner: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(password: string): Promise<boolean>;
}

// Verification token model ---------------
const schema = new Schema<AuthVerificationTokenDocument, {}, Methods>({
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
    expires: 86400,
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

const AuthVerificationTokenModel = model('AuthVerificationToken', schema);
export default AuthVerificationTokenModel;
