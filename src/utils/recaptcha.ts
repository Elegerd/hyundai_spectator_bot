import { captchaApiKey } from 'src/constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

const recaptcha = RecaptchaPlugin({
  provider: {
    id: '2captcha',
    token: captchaApiKey,
  },
  visualFeedback: true,
});

export default recaptcha;
