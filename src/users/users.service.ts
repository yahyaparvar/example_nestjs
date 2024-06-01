import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { AvatarDocument } from './schemas/avatar.schema';
import { User } from './schemas/user.schema';

dotenv.config();

@Injectable()
export class UsersService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Avatar') private readonly avatarModel: Model<AvatarDocument>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async createUser(name: string, email: string): Promise<User> {
    const newUser = new this.userModel({ name, email });
    const user = await newUser.save();

    // Send a message to RabbitMQ
    this.client.emit('user_created', user);

    // Send email
    await this.sendEmail(user);

    return user;
  }

  private async sendEmail(user: User) {
    const mailOptions = {
      from: `Yahya from Payever`,
      to: user.email,
      subject: 'Welcome to Our Payever',
      text: `Hello ${user.name}, welcome to our Payever!`,
      html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <table style="width: 100%; max-width: 600px; margin: auto; border-collapse: collapse;">
          <tr>
            <td style="background-color: #161617; padding: 20px; text-align: center; color: white;">
              <h1>Welcome to Our Service!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background-color: #f9f9f9;">
              <h2>Hello ${user.name},</h2>
              <p>We're excited to have you on board. Thank you for joining our service!</p>
              <p style="margin: 20px 0;">
                <a href="https://payever.careers/uk" style="padding: 10px 20px; background-color: #161617; color: white; text-decoration: none; border-radius: 5px;">
                  Get Started
                </a>
              </p>
              <p>If you have any questions, feel free to <a href="mailto:yahyaparvar1@gmail.com.com" style="color: #161617;">contact us</a>.</p>
              <p>Best regards,<br>Your Company</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
              © ${new Date().getFullYear()} Payever. All rights reserved.
            </td>
          </tr>
        </table>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending email to ${user.email}:`, error);
    }
  }

  async getUserById(userId: string) {
    try {
      const response = await axios.get(`https://reqres.in/api/users/${userId}`);
      return response.data.data; // Returns the user data as is
    } catch (error) {
      throw new Error(`Unable to fetch user: ${error.message}`);
    }
  }

  async getUserAvatar(userId: string) {
    try {
      const avatarEntry = await this.avatarModel.findOne({ userId }).exec();
      if (avatarEntry) {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'avatars',
          `${avatarEntry.hash}.jpg`,
        );
        const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });
        return base64Image;
      } else {
        const user = await this.getUserById(userId);
        const avatarUrl = user.avatar;

        const response = await axios.get(avatarUrl, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = response.data;

        const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'avatars',
          `${hash}.jpg`,
        );

        fs.writeFileSync(filePath, imageBuffer);

        const newAvatar = new this.avatarModel({ userId, hash });
        await newAvatar.save();

        return imageBuffer.toString('base64');
      }
    } catch (error) {
      throw new Error(`Unable to fetch avatar: ${error.message}`);
    }
  }
  async deleteUserAvatar(userId: string) {
    try {
      const avatarEntry = await this.avatarModel.findOne({ userId }).exec();
      if (avatarEntry) {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'avatars',
          `${avatarEntry.hash}.jpg`,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await this.avatarModel.deleteOne({ userId }).exec();
        return { message: 'Avatar deleted successfully' };
      } else {
        return { message: 'Avatar not found' };
      }
    } catch (error) {
      throw new Error(`Unable to delete avatar: ${error.message}`);
    }
  }
}
