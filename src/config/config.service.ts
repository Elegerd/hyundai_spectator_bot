import * as Joi from '@hapi/joi';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

import { NumberEnvVariables, StringEnvVariables } from './config.types';

import { ENV_FILE_PATH } from './config.constants';

export type EnvConfig = Record<string, string | boolean | number>;

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    let config = {};
    if (fs.existsSync(ENV_FILE_PATH)) {
      config = dotenv.parse(fs.readFileSync(ENV_FILE_PATH));
    }
    this.envConfig = this.validateInput({ ...config, ...process.env });
  }

  getString(key: StringEnvVariables): string {
    if (!!this.envConfig[key] && typeof this.envConfig[key] !== 'string') {
      throw new Error(
        `Config getString('${key}') not a string ${this.envConfig[key]}`,
      );
    }

    return this.envConfig[key] as string;
  }

  getNumber(key: NumberEnvVariables): number {
    if (typeof this.envConfig[key] !== 'number') {
      throw new Error(`Config getNumber not a number`);
    }

    return this.envConfig[key] as number;
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const schema = {
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
      PORT: Joi.number().default(3000),
      TELEGRAM_BOT_TOKEN: Joi.string().required(),
    };

    const envVarsSchema: Joi.ObjectSchema = Joi.object(schema);

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig,
      {
        allowUnknown: true,
        stripUnknown: true,
      },
    );

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    return validatedEnvConfig;
  }
}
