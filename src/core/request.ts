import { defaultsDeep, inRange, random} from 'lodash';
import { Subject } from 'rxjs';
import { AttemptOptions, retry } from '@lifeomic/attempt';
import * as request from 'request-promise';
import { Options, Response } from 'request';
import { IgApiClient } from './client';
import { createHmac } from 'crypto';
import * as Chance from 'chance';
import {
  IgActionSpamError,
  IgCheckpointError,
  IgClientError,
  IgInactiveUserError,
  IgLoginRequiredError, IgLoginTwoFactorRequiredError,
  IgNetworkError,
  IgNotFoundError,
  IgRequestsLimitError,
  IgResponseError, IgLoginBadPasswordError
} from '../errors';
import { IgResponse } from '../types';
import JSONbigInt = require('json-bigint');

const JSONbigString = JSONbigInt({ storeAsString: true });

import debug from 'debug';
type Payload = { [key: string]: any } | string;

interface SignedPost {
  signed_body: string;
  ig_sig_key_version: string;
}
export class Request {
  private static requestDebug = debug('ig:request');
  end$ = new Subject();
  error$ = new Subject<IgClientError>();
  attemptOptions: Partial<AttemptOptions<any>> = {
    maxAttempts: 1,
  };
  defaults: Partial<Options> = {};
  deviceid?: string;
  uuid?: string;
  build?: string[] = ["NMF26X","MMB29M","MRA58K","NRD90M","MRA58K","OPM1.171019.011","IMM76L","JZO54K","JDQ39","JLS36I","KTU84P","LRX22C","LMY48M","MMB29V","NRD91N","N2G48C"];
  deviceString?: string;
  devices?: string[] = ["25/7.1.1; 440dpi; 1080x1920; Xiaomi; Mi Note 3; jason; qcom","23/6.0.1; 480dpi; 1080x1920; Xiaomi; Redmi Note 3; kenzo; qcom","23/6.0; 480dpi; 1080x1920; Xiaomi; Redmi Note 4; nikel; mt6797","24/7.0; 480dpi; 1080x1920; Xiaomi/xiaomi; Redmi Note 4; mido; qcom","23/6.0; 480dpi; 1080x1920; Xiaomi; Redmi Note 4X; nikel; mt6797","27/8.1.0; 440dpi; 1080x2030; Xiaomi/xiaomi; Redmi Note 5; whyred; qcom","23/6.0.1; 480dpi; 1080x1920; Xiaomi; Redmi 4; markw; qcom","27/8.1.0; 440dpi; 1080x2030; Xiaomi/xiaomi; Redmi 5 Plus; vince; qcom","25/7.1.2; 440dpi; 1080x2030; Xiaomi/xiaomi; Redmi 5 Plus; vince; qcom","26/8.0.0; 480dpi; 1080x1920; Xiaomi; MI 5; gemini; qcom","27/8.1.0; 480dpi; 1080x1920; Xiaomi/xiaomi; Mi A1; tissot_sprout; qcom","26/8.0.0; 480dpi; 1080x1920; Xiaomi; MI 6; sagit; qcom","25/7.1.1; 440dpi; 1080x1920; Xiaomi; MI MAX 2; oxygen; qcom","24/7.0; 480dpi; 1080x1920; Xiaomi; MI 5s; capricorn; qcom","26/8.0.0; 480dpi; 1080x1920; samsung; SM-A520F; a5y17lte; samsungexynos7880","26/8.0.0; 480dpi; 1080x2076; samsung; SM-G950F; dreamlte; samsungexynos8895","26/8.0.0; 640dpi; 1440x2768; samsung; SM-G950F; dreamlte; samsungexynos8895","26/8.0.0; 420dpi; 1080x2094; samsung; SM-G955F; dream2lte; samsungexynos8895","26/8.0.0; 560dpi; 1440x2792; samsung; SM-G955F; dream2lte; samsungexynos8895","24/7.0; 480dpi; 1080x1920; samsung; SM-A510F; a5xelte; samsungexynos7580","26/8.0.0; 480dpi; 1080x1920; samsung; SM-G930F; herolte; samsungexynos8890","26/8.0.0; 480dpi; 1080x1920; samsung; SM-G935F; hero2lte; samsungexynos8890","26/8.0.0; 420dpi; 1080x2094; samsung; SM-G965F; star2lte; samsungexynos9810","26/8.0.0; 480dpi; 1080x2076; samsung; SM-A530F; jackpotlte; samsungexynos7885","24/7.0; 640dpi; 1440x2560; samsung; SM-G925F; zerolte; samsungexynos7420","26/8.0.0; 420dpi; 1080x1920; samsung; SM-A720F; a7y17lte; samsungexynos7880","24/7.0; 640dpi; 1440x2560; samsung; SM-G920F; zeroflte; samsungexynos7420","24/7.0; 420dpi; 1080x1920; samsung; SM-J730FM; j7y17lte; samsungexynos7870","26/8.0.0; 480dpi; 1080x2076; samsung; SM-G960F; starlte; samsungexynos9810","26/8.0.0; 420dpi; 1080x2094; samsung; SM-N950F; greatlte; samsungexynos8895","26/8.0.0; 420dpi; 1080x2094; samsung; SM-A730F; jackpot2lte; samsungexynos7885","26/8.0.0; 420dpi; 1080x2094; samsung; SM-A605FN; a6plte; qcom","26/8.0.0; 480dpi; 1080x1920; HUAWEI/HONOR; STF-L09; HWSTF; hi3660","27/8.1.0; 480dpi; 1080x2280; HUAWEI/HONOR; COL-L29; HWCOL; kirin970","26/8.0.0; 480dpi; 1080x2032; HUAWEI/HONOR; LLD-L31; HWLLD-H; hi6250","26/8.0.0; 480dpi; 1080x2150; HUAWEI; ANE-LX1; HWANE; hi6250","26/8.0.0; 480dpi; 1080x2032; HUAWEI; FIG-LX1; HWFIG-H; hi6250","27/8.1.0; 480dpi; 1080x2150; HUAWEI/HONOR; COL-L29; HWCOL; kirin970","26/8.0.0; 480dpi; 1080x2038; HUAWEI/HONOR; BND-L21; HWBND-H; hi6250","23/6.0.1; 420dpi; 1080x1920; LeMobile/LeEco; Le X527; le_s2_ww; qcom"];
  constructor(private client: IgApiClient) {}

  private static requestTransform(body, response: Response, resolveWithFullResponse) {
    try {
      response.body = JSONbigString.parse(body);
    } catch (e) {
      if (inRange(response.statusCode, 200, 299)) {
        throw e;
      }
    }
    return resolveWithFullResponse ? response : response.body;
  }
  public async hasOwnProperty(obj: [], prop: string) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  public async send<T = any>(userOptions: Options, onlyCheckHttpStatus?: boolean): Promise<IgResponse<T>> {
    const options = defaultsDeep(
      userOptions,
      {
        baseUrl: 'https://www.instagram.com',
        uri: '',
        resolveWithFullResponse: true,
        proxy: this.client.state.proxyUrl,
        simple: false,
        transform: Request.requestTransform,
        jar: this.client.state.cookieJar,
        strictSSL: false,
        gzip: true,
        headers: this.getDefaultHeaders(),
        method: 'GET',
      },
      this.defaults,
    );
    Request.requestDebug(`Requesting ${options.method} ${options.url || options.uri || '[could not find url]'}`);
    const response = await this.faultTolerantRequest(options);
    this.updateState(response);
    //process.nextTick(() => this.end$.next());
    let errors: Error;
    const hasAuth = await this.hasOwnProperty(response.body, "authenticated");
    
    if(typeof response.body == "object" && response.statusCode == 200) {
        if (hasAuth) {
          if (hasAuth && response.body.authenticated) {
            return response;
          } else if (hasAuth && !response.body.authenticated) {
            errors = new IgLoginBadPasswordError("IgLoginBadPasswordError");
          }
          throw errors;
        }
        return response;
    }
    const error = this.handleResponseError(response);
    process.nextTick(() => this.error$.next(error));
    throw error;
  }

  private updateState(response: IgResponse<any>) {
    const {
      'x-ig-set-www-claim': wwwClaim,
      'ig-set-authorization': auth,
      'ig-set-password-encryption-web-key-id': pwKeyId,
      'ig-set-password-encryption-web-pub-key': pwPubKey,
    } = response.headers;
    if (typeof wwwClaim == 'string') {
      this.client.state.igWWWClaim = wwwClaim;
    }
    if (typeof auth == 'string' && !auth.endsWith(':')) {
      this.client.state.authorization = auth;
    }
    if (typeof pwKeyId == 'string') {
      this.client.state.passwordEncryptionKeyId = pwKeyId;
    }
    if (typeof pwPubKey == 'string') {
      this.client.state.passwordEncryptionPubKey = pwPubKey;
    }
  }

  private handleResponseError(response: Response): IgClientError {
    Request.requestDebug(
      `Request ${response.request.method} ${response.request.uri.path} failed: ${
        typeof response.body === 'object' ? JSON.stringify(response.body) : response.body
      }`,
    );
    const json = response.body;
    if (json.spam) {
      return new IgActionSpamError(response);
    }
    if (response.statusCode == 404) {
      return new IgNotFoundError(response);
    }
    if (response.statusCode == 302) {
      return new IgLoginRequiredError(response);
    }
    if (response.statusCode == 401) {
      return new IgLoginRequiredError(response);
    }
    if (response.statusCode == 429) {
      return new IgRequestsLimitError();
    }
    if (typeof json.message == 'string') {
      if (json.message == 'checkpoint_required') {
        this.client.state.checkpoint = json;
        return new IgCheckpointError(response);
      }
      if (json.message.includes("Your account has been disabled")) {
        return new IgInactiveUserError(response);
      }
      if(json.message == 'Please wait a few minutes before you try again.'){
        return new IgRequestsLimitError();
      }
    }
    if(json.two_factor_required){
      return new IgLoginTwoFactorRequiredError("IgLoginTwoFactorRequiredError");
    }
    if(json.error_type == 'two_factor_required'){
      return new IgLoginTwoFactorRequiredError("IgLoginTwoFactorRequiredError");
    }
    if(json.error_type == 'generic_request_error'){
      return new IgRequestsLimitError()
    }
    return new IgResponseError(response);
  }

  protected async faultTolerantRequest(options: Options) {
    try {
      return await retry(async () => request(options), this.attemptOptions);
    } catch (err) {
      throw new IgNetworkError(err);
    }
  }
  public sign(payload: Payload): SignedPost {
    const json = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const signature = this.signature(json);
    return {
      ig_sig_key_version: '4',
      signed_body: `${signature}.${json}`,
    };
  }
  public signature(data: string) {
    return createHmac('sha256', '9193488027538fd3450b83b7d05286d4ca9599a0f7eeed90d8c85925698a05dc')
      .update(data)
      .digest('hex');
  }

  public getDefaultHeaders() {
    return {
      'User-Agent': {},
      'accept-language': this.client.state.language || 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'x-requested-with': 'XMLHttpRequest',
      'X-IG-WWW-Claim': this.client.state.igWWWClaim || '0',
      'x-instagram-ajax': 1,
      'x-csrftoken': this.client.state.cookieCsrfToken || this.client.state.csrftoken,
      'x-ig-app-id': 936619743392459,
      'origin': 'https://www.instagram.com',
      Referer: this.client.state.host
    };
  }

  public getHeadersAppVersion() {
    return {
      'User-Agent': this.appUserAgent,
      'X-Ads-Opt-Out': '0',
      // needed? 'X-DEVICE-ID': this.client.state.uuid,
      'X-CM-Bandwidth-KBPS': '-1.000',
      'X-CM-Latency': '-1.000',
      'X-IG-App-Locale': 'id-ID',
      'X-IG-Device-Locale': 'id-ID',
      'X-Pigeon-Rawclienttime': (Date.now() / 1000).toFixed(3),
      'X-IG-Connection-Speed': `${random(1000, 3700)}kbps`,
      'X-IG-Bandwidth-Speed-KBPS': '-1.000',
      'X-IG-Bandwidth-TotalBytes-B': '0',
      'X-IG-Bandwidth-TotalTime-MS': '0',
      'X-MID': this.client.state.extractCookie('mid')?.value,
      'X-IG-WWW-Claim': this.client.state.igWWWClaim || '0',
      'X-IG-Device-ID': this.uuid,
      'X-IG-Android-ID': this.deviceid,
      'Accept-Language': this.client.state.language.replace('_', '-'),
      'X-FB-HTTP-Engine': 'Liger',
      Authorization: this.client.state.authorization,
      Host: 'i.instagram.com',
      'Accept-Encoding': 'gzip',
      Connection: 'close',
    };
  }

  public async sendAppVersion<T = any>(userOptions: Options, onlyCheckHttpStatus?: boolean): Promise<IgResponse<T>> {
    const options = defaultsDeep(
      userOptions,
      {
        baseUrl: 'https://i.instagram.com/',
        resolveWithFullResponse: true,
        proxy: this.client.state.proxyUrl,
        simple: false,
        transform: Request.requestTransform,
        jar: this.client.state.cookieJar,
        strictSSL: false,
        gzip: true,
        headers: this.getHeadersAppVersion(),
        method: 'GET',
      },
      this.defaults,
    );
    Request.requestDebug(`Requesting ${options.method} ${options.url || options.uri || '[could not find url]'}`);
    const response = await this.faultTolerantRequest(options);
    this.updateState(response);
    if (response.body.status === 'ok' || (onlyCheckHttpStatus && response.statusCode === 200)) {
      return response;
    }
    const error = this.handleResponseError(response);
    process.nextTick(() => this.error$.next(error));
    throw error;
  }

  public generateDevice(seed: string): void {
    const chance = new Chance(seed);
    this.deviceString = chance.pickone(this.devices);
    const id     = chance.string({
      pool: 'abcdef0123456789',
      length: 16,
    });
    this.deviceid = `android-${id}`;
    this.uuid = chance.guid();
  }
  public get appUserAgent() {
    return `Instagram 121.0.0.29.119 Android (${this.deviceString}; en_US; 185203708)`;
  }
}