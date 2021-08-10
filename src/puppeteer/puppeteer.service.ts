// @ts-nocheck
import { ElementHandle } from 'puppeteer';
import { Injectable } from '@nestjs/common';
import PuppeteerBot2a from 'src/utils/PuppeteerBot2a';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { hyundaiShowroomUrl } from 'src/constants';
import { CarInfo } from 'src/types/common';
import formatCar from 'src/utils/formatCar';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PuppeteerService {
  private bot: any;

  constructor(
    @InjectBot() private readonly telegramBot: Telegraf,
  ) {
    this.bot = new PuppeteerBot2a({
      preferNonHeadless: false,
    });

    this.init();
  }

  private async init() {
    this.bot.init();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkShowroomPage() {
    try {
      console.log(`[INFO]: Check showroom - ${Date.now()}`)

      if (this.bot.page.url() !== hyundaiShowroomUrl) {
        await this.bot.goto(hyundaiShowroomUrl, { waitUntil: 'load', timeout: 0 });
      } else {
        await this.bot.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      }

      await this.bot.page.waitForSelector('iframe[title="recaptcha challenge"]', {
        timeout: 5000,
      })
        .then(() => console.log(`[INFO]: Captcha appeared - ${Date.now()}`))
        .catch(() => console.log(`[INFO]: Captcha not appeared - ${Date.now()}`))

      const { solved, error } = await this.bot.page.solveRecaptchas();

      if (!!solved.length) {
        console.log(`[INFO]: Captcha solved - ${Date.now()}`)
      }

      if (error) {
        throw new Error(`[ERROR]: Captcha not resolved - ${Date.now()}`);
      }

      await this.bot.page.waitForSelector('.car-columns', {
        timeout: 5000,
      })
        .then(() => console.log(`[INFO]: Columns with cars found - ${Date.now()}`))
        .catch(() => console.log(`[INFO]: Columns with cars not found - ${Date.now()}`))

      const elements: ElementHandle[] = await this.bot.page.$$(
        '.car-item',
      );

      console.log(`[INFO]: Found ${elements.length} elements - ${Date.now()}`)

      if (!!elements.length) {
        const messages = await Promise.all(elements.map(async (el): Promise<string> => {
          const classNames = await el.getProperty('className');

          const parseClassNames = classNames?._remoteObject.value;

          const id = parseClassNames && typeof parseClassNames === 'string' ? parseClassNames.replace(/[^\d]/g, '') : null;

          const infoNode = await el.$('.car-item__left');
          const infoNodeChildren = await infoNode.$$(':scope > *');

          const availabilityNode = await el.$('.car-item__availability');
          
          const price = await el.$eval('.car-item__price-top', (el) => el.textContent);

          const model = await infoNodeChildren?.[0].$eval('*:first-child > *:first-child', (el) => el.textContent);

          const equipment = await infoNodeChildren?.[0].$eval('*:first-child > *:last-child > *:first-child', (el) => el.textContent?.replace(
            'Комплектация ',
            '',
          ) || null);

          const equipmentPackageNode = await infoNodeChildren?.[0].$('.car-item__package');

          let equipmentPackage = null;

          if (equipmentPackageNode) {
            equipmentPackage = await equipmentPackageNode.$eval('*:last-child', (el) => el.textContent);
          }

          const engine =
            await infoNodeChildren?.[1].$eval('*:nth-of-type(2) > *:nth-of-type(2)', (el) => el.textContent);

          const carColor =
            await infoNodeChildren?.[3].$eval('*:first-child > *:last-child', (el) => el.textContent);

          const interiorColor =
            await infoNodeChildren?.[3].$eval('*:last-child > *:last-child', (el) => el.textContent);

          const countString = await availabilityNode?.$eval('*:last-child', (el) => el.textContent);
          const count = countString
            ? parseInt(countString.replace(/[^\d]/g, ''))
            : null;

          const carInfo: CarInfo = {
            id: null,
            model,
            price,
            equipment: `${equipment}${equipmentPackage ? (' + ' + equipmentPackage) : ''}`,
            engine,
            carColor,
            interiorColor,
            count,
            url: id ? `${hyundaiShowroomUrl}model/${id}` : hyundaiShowroomUrl,
          }
          return formatCar(carInfo);
        }));

        console.log(`[INFO]: Sending ${messages.length} messages - ${Date.now()}`)

        messages.forEach((message) => {
          this.telegramBot.telegram.sendMessage('@hyundai_spectator', message)
        });

      } else {
        console.log(`[INFO]: No cars - ${Date.now()}`)
      }
    } catch(e){
      console.log(e.message);
    }
  }
}
