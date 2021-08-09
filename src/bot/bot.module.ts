import { ConfigService } from 'src/config/config.service';
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        const token = config.getString('TELEGRAM_BOT_TOKEN');
        return {
          token,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TelegrafModule],
  providers: [],
})
export class BotModule {}
