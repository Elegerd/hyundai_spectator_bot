import { AppController } from './app.controller';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from './config/config.module';
import { Module } from '@nestjs/common';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    TerminusModule,
    PuppeteerModule,
    BotModule,
    ScheduleModule.forRoot(),
    { module: ConfigModule, global: true },
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
