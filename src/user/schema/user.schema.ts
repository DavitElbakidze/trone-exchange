import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleEnum } from '../enum/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  hashedPassword: string;

  @Prop({ required: true, enum: RoleEnum, default: RoleEnum.User })
  role: RoleEnum;
}

export const UserSchema = SchemaFactory.createForClass(User);
