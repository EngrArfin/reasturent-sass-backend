import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from 'src/enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Prop({ type: String, required: true })
  password!: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.MANAGER,
    required: true,
  })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Business' })
  businessId?: Types.ObjectId;

  @Prop({ type: String })
  pin?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
