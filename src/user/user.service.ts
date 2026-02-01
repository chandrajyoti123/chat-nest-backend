
import { Injectable } from '@nestjs/common';
import { EnhancedPrismaService } from '@prisma/enhanced-prisma.service';


@Injectable()
export class UserService {
  constructor( private readonly prisma: EnhancedPrismaService) { }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
        
      },
     

    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

   updateAbout(userId: string, about: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { about },
    });
  }
}
