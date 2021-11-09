import { defaultsDeep, inRange} from 'lodash';
import { Subject } from 'rxjs';
import { AttemptOptions, retry } from '@lifeomic/attempt';
import * as request from 'request-promise';
import { Options, Response } from 'request';
import { IgApiClient } from './client';
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

  public getDefaultHeaders() {
    return {
      'User-Agent': this.client.state.webUserAgent,
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
}