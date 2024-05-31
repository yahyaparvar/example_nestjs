import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { User } from './schemas/user.schema';

dotenv.config();

@Injectable()
export class UsersService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'smtp.gmail.com',
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
      from: `"Your Name" <${process.env.SMTP_USER}>`, // sender address
      to: user.email, // list of receivers
      subject: 'Welcome to Our Service', // Subject line
      text: `Hello ${user.name}, welcome to our service!`, // plain text body
      html: `<b>Hello ${user.name}</b>, welcome to our service!`, // html body
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending email to ${user.email}:`, error);
    }
  }
}
