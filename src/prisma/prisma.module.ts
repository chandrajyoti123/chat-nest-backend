import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EnhancedPrismaService } from './enhanced-prisma.service';

@Module({
  providers: [PrismaService, EnhancedPrismaService],
  exports: [PrismaService, EnhancedPrismaService], 
})
export class PrismaModule {}
