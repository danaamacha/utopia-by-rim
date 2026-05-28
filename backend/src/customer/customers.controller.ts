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

// Swap in your actual admin guard
// import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/customers')
// @UseGuards(AdminGuard)
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