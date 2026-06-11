// backend/src/customer/customers.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AdminCustomersQueryDto } from './dto/admin-customers-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * GET /admin/customers?page=1&limit=50&sort=desc&search=sara&role=owner
   */
  @Get()
  list(@Query() query: AdminCustomersQueryDto) {
    return this.customersService.adminListCustomers(query);
  }

  /**
   * GET /admin/customers/:id
   */
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.adminGetCustomerById(id);
  }
}