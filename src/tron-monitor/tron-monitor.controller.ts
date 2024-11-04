import { Controller, Get, Post, Body, Delete } from '@nestjs/common';
import { TronMonitorService } from './tron-monitor.service';

@Controller('tron-monitor')
export class TronMonitorController {
  constructor(private readonly tronMonitorService: TronMonitorService) {}

  @Get('addresses')
  getWatchedAddresses() {
    return {
      addresses: this.tronMonitorService.getWatchedAddresses(),
    };
  }

  @Post('address')
  addAddress(@Body() body: { address: string }) {
    const success = this.tronMonitorService.addWatchAddress(body.address);
    return {
      success,
      message: success ? 'Address added' : 'Invalid address',
      addresses: this.tronMonitorService.getWatchedAddresses(),
    };
  }

  @Delete('address')
  removeAddress(@Body() body: { address: string }) {
    const success = this.tronMonitorService.removeWatchAddress(body.address);
    return {
      success,
      message: success ? 'Address removed' : 'Address not found',
      addresses: this.tronMonitorService.getWatchedAddresses(),
    };
  }
}
