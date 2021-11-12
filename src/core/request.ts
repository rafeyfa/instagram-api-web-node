import { defaultsDeep, inRange, random} from 'lodash';
import { Subject } from 'rxjs';
import { AttemptOptions, retry } from '@lifeomic/attempt';
import * as request from 'request-promise';
import { Options, Response } from 'request';
import { IgApiClient } from './client';
import { createHmac } from 'crypto';
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
  public async sendAppVersion<T = any>(userOptions: Options, onlyCheckHttpStatus?: boolean): Promise<IgResponse<T>> {
    const options = defaultsDeep(
      userOptions,
      {
        baseUrl: 'https://i.instagram.com/api/v1',
        resolveWithFullResponse: true,
        proxy: this.client.state.proxyUrl,
        simple: false,
        transform: Request.requestTransform,
        jar: this.client.state.cookieJar,
        strictSSL: false,
        gzip: true,
        headers: {
          'User-Agent': this.client.state.appUserAgent,
          'X-Ads-Opt-Out': this.client.state.adsOptOut ? '1' : '0',
          // needed? 'X-DEVICE-ID': this.client.state.uuid,
          'X-CM-Bandwidth-KBPS': '-1.000',
          'X-CM-Latency': '-1.000',
          'X-IG-App-Locale': this.client.state.language,
          'X-IG-Device-Locale': this.client.state.language,
          'X-Pigeon-Session-Id': this.client.state.pigeonSessionId,
          'X-Pigeon-Rawclienttime': (Date.now() / 1000).toFixed(3),
          'X-IG-Connection-Speed': `${random(1000, 3700)}kbps`,
          'X-IG-Bandwidth-Speed-KBPS': '-1.000',
          'X-IG-Bandwidth-TotalBytes-B': '0',
          'X-IG-Bandwidth-TotalTime-MS': '0',
          'X-IG-EU-DC-ENABLED':
            typeof this.client.state.euDCEnabled === 'undefined' ? void 0 : this.client.state.euDCEnabled.toString(),
          'X-IG-Extended-CDN-Thumbnail-Cache-Busting-Value': this.client.state.thumbnailCacheBustingValue.toString(),
          'X-Bloks-Version-Id': this.client.state.bloksVersionId,
          'X-MID': this.client.state.extractCookie('mid')?.value,
          'X-IG-WWW-Claim': this.client.state.igWWWClaim || '0',
          'X-Bloks-Is-Layout-RTL': this.client.state.isLayoutRTL.toString(),
          'X-IG-Connection-Type': this.client.state.connectionTypeHeader,
          'X-IG-Capabilities': this.client.state.capabilitiesHeader,
          'X-IG-App-ID': this.client.state.fbAnalyticsApplicationId,
          'X-IG-Device-ID': this.client.state.uuid,
          'X-IG-Android-ID': this.client.state.deviceId,
          'Accept-Language': this.client.state.language.replace('_', '-'),
          'X-FB-HTTP-Engine': 'Liger',
          Authorization: this.client.state.authorization,
          Host: 'i.instagram.com',
          'Accept-Encoding': 'gzip',
          Connection: 'close',
        },
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

}