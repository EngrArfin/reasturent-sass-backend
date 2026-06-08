import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true, unique: true, type: String })
  name!: string;

  @Prop({ required: true, type: String })
  businessName!: string;

  @Prop({ required: true, type: String })
  email!: string;

  @Prop({ type: String, default: null })
  phone?: string;

  @Prop({ type: String, default: null })
  address?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({
    type: Object,
    default: {
      timezone: 'UTC',
      currency: 'USD',
      taxRate: 0,
    },
  })
  settings!: {
    timezone?: string;
    currency?: string;
    taxRate?: number;
  };
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
