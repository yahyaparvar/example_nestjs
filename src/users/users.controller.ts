import { Body, Controller, Post } from '@nestjs/common';

import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

@Controller('api/users') // Ensure this path matches the endpoint you're calling
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() createUserDto: { name: string; email: string },
  ): Promise<User> {
    const { name, email } = createUserDto;
    return this.usersService.createUser(name, email);
  }
}
