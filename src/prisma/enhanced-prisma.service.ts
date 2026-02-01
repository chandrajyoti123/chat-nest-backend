// import { Injectable, Scope } from '@nestjs/common';
// import { enhance } from '@zenstackhq/runtime';
// import { ClsService } from 'nestjs-cls';
// import { PrismaClient } from '@prisma/client';
// import { PrismaService } from './prisma.service';

// interface ZenstackEnhancedClient extends PrismaClient { }

// @Injectable({ scope: Scope.REQUEST })
// export class EnhancedPrismaService {
//   private enhanced: ZenstackEnhancedClient | null = null;

//   constructor(
//     private readonly clsService: ClsService,
//     private readonly rawPrisma: PrismaService
//   ) { }

//   // ✅ Lazy initialization — fetch user when actually needed
//   private getEnhancedClient(): ZenstackEnhancedClient {
//     if (!this.enhanced) {
//       const clsUser = this.clsService.get('user');
//      console.log(clsUser,"user")

//       // 🧩 Map fields so ZenStack gets what it expects
//       const user = clsUser
//         ? { id: clsUser.id, email: clsUser.email }
//         : undefined;

//       this.enhanced = enhance(this.rawPrisma, { user }) as unknown as ZenstackEnhancedClient;
//     }
//     return this.enhanced;
//   }


//   public get client() {
//     return this.getEnhancedClient();
//   }

//   get raw() {
//     return this.rawPrisma;
//   }

//   public get user() {
//     return this.getEnhancedClient().user;
//   }

//   public get contact() {
//     return this.getEnhancedClient().contact;
//   }

//   public get conversation() {
//     return this.getEnhancedClient().conversation;
//   }

//   public get conversationParticipant() {
//     return this.getEnhancedClient().conversationParticipant;
//   }

//   public get message() {
//     return this.getEnhancedClient().message;
//   }

// }












import { Injectable } from '@nestjs/common';
import { enhance } from '@zenstackhq/runtime';
import { ClsService } from 'nestjs-cls';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class EnhancedPrismaService {
  constructor(
    private readonly clsService: ClsService,
    private readonly rawPrisma: PrismaService,
  ) { }

  /** ✅ Public HTTP (no auth) */
  get public(): PrismaClient {
    return this.rawPrisma;
  }

  /** ✅ WebSocket / explicit user */
  enhanceForUser(user: { id: string; email?: string }): PrismaClient {
    return enhance(this.rawPrisma, { user }) as PrismaClient;
  }

  get raw() {
    return this.rawPrisma;
  }

  /** 🔄 Backward compatibility (authenticated only) */
  private enhanceSafe() {
    const clsUser = this.clsService.get('user');

    // 🔓 Public context (OTP, login, signup)
    if (!clsUser) {
      return this.rawPrisma;
    }

    return enhance(this.rawPrisma, {
      user: { id: clsUser.id, email: clsUser.email },
    }) as PrismaClient;
  }

  get user() {
    return this.enhanceSafe().user;
  }

  get contact() {
    return this.enhanceSafe().contact;
  }

  get conversation() {
    return this.enhanceSafe().conversation;
  }

  get conversationParticipant() {
    return this.enhanceSafe().conversationParticipant;
  }

  get message() {
    return this.enhanceSafe().message;
  }
  get messageRead() {
    return this.enhanceSafe().messageRead;
  }

  get messageDelete() {
    return this.enhanceSafe().messageDelete;
  }

  get call() {
    return this.enhanceSafe().call;
  }
  
  get callParticipant() {
    return this.enhanceSafe().callParticipant;
  }
  




}






