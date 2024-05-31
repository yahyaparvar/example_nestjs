import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/users') // Ensure this path matches the endpoint you're calling
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: { name: string; email: string }) {
    const { name, email } = createUserDto;
    return this.usersService.createUser(name, email);
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Get(':userId/avatar')
  async getUserAvatar(@Param('userId') userId: string) {
    return this.usersService.getUserAvatar(userId);
  }
}
