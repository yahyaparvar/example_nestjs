import { ClientProxy } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

jest.mock('nodemailer');
jest.mock('axios');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<User>;
  let client: ClientProxy;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({}); // Mock sendMail function

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: {
            create: jest.fn(),
            save: jest.fn().mockImplementation(function () {
              return this;
            }),
          },
        },
        {
          provide: getModelToken('Avatar'),
          useValue: {},
        },
        {
          provide: 'RABBITMQ_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>(getModelToken('User'));
    client = module.get<ClientProxy>('RABBITMQ_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user, emit an event, and send an email', async () => {
      const userDto = { name: 'test', email: 'test@gmail.com' };
      const createdUser = { ...userDto, _id: 'mockId' };

      jest.spyOn(userModel, 'create').mockResolvedValue(createdUser as any);
      jest.spyOn(client, 'emit').mockImplementation(() => null);

      const result = await service.createUser(userDto.name, userDto.email);

      expect(result).toEqual(createdUser);
      console.log('\x1b[32m%s\x1b[0m', '✓ User creation successful');

      expect(userModel.create).toHaveBeenCalledWith(userDto);
      console.log(
        '\x1b[32m%s\x1b[0m',
        '✓ Called userModel.create with correct user data',
      );

      expect(client.emit).toHaveBeenCalledWith('user_created', createdUser);
      console.log(
        '\x1b[32m%s\x1b[0m',
        '✓ Event emitted to RabbitMQ with correct data',
      );

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userDto.email,
          subject: 'Welcome to Payever',
          text: expect.any(String),
          html: expect.any(String),
        }),
      );
      console.log('\x1b[32m%s\x1b[0m', '✓ Email sent with correct details');
    });
  });

  describe('getUserById', () => {
    it('should return user data by ID', async () => {
      const userId = '1';
      const userResponse = {
        data: {
          id: 1,
          email: 'janet.weaver@reqres.in',
          first_name: 'Janet',
          last_name: 'Weaver',
          avatar: 'https://reqres.in/img/faces/1-image.jpg',
        },
      };

      jest.spyOn(axios, 'get').mockResolvedValue({ data: userResponse });

      const result = await service.getUserById(userId);

      expect(result).toEqual(userResponse.data);
      expect(axios.get).toHaveBeenCalledWith(
        `https://reqres.in/api/users/${userId}`,
      );
      console.log(
        '\x1b[32m%s\x1b[0m',
        '✓ Fetched user data by ID successfully',
      );
    });

    it('should throw an error if unable to fetch user data', async () => {
      const userId = '1';
      const errorMessage = 'Unable to fetch user';

      jest.spyOn(axios, 'get').mockRejectedValue(new Error(errorMessage));

      await expect(service.getUserById(userId)).rejects.toThrow(errorMessage);
      console.log(
        '\x1b[32m%s\x1b[0m',
        '✓ Shows error if unable to fetch user data',
      );
    });
  });
});
