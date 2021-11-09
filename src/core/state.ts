import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { jar } from 'request';
import { Cookie, CookieJar, MemoryCookieStore } from 'tough-cookie';
import { IgCookieNotFoundError, IgUserIdNotFoundError } from '../errors';

import { Enumerable } from '../decorators';
import debug from 'debug';
const user_agents_1 = require("user-agents");
const useragents = new user_agents_1();
export class State {
  private static stateDebug = debug('ig:state');
  language: string = 'id-ID';
  timezoneOffset: string = String(new Date().getTimezoneOffset() * -60);
  proxyUrl: string;
  @Enumerable(false)
  cookieStore = new MemoryCookieStore();
  @Enumerable(false)
  cookieJar = jar(this.cookieStore);
  @Enumerable(false)
  checkpoint: string = null;
  @Enumerable(false)
  challenge: string = null;
  csrftoken?: string;
  host: string = "https://www.instagram.com";
  igWWWClaim?: string;
  authorization?: string;
  passwordEncryptionPubKey?: string;
  passwordEncryptionKeyId?: string | number;

  public get webUserAgent() {
    return useragents.toString();
  }

  public get cookieCsrfToken() {
    try {
      return this.extractCookieValue('csrftoken');
    } catch {
      State.stateDebug('csrftoken lookup failed, returning "missing".');
      return 'missing';
    }
  }

  public get cookieUserId() {
    return this.extractCookieValue('ds_user_id');
  }

  public get cookieUsername() {
    return this.extractCookieValue('ds_user');
  }

  public extractCookie(key: string): Cookie | null {
    const cookies = this.cookieJar.getCookies(this.host);
    return _.find(cookies, { key }) || null;
  }

  public extractCookieValue(key: string): string {
    const cookie = this.extractCookie(key);
    if (cookie === null) {
      State.stateDebug(`Could not find ${key}`);
      throw new IgCookieNotFoundError(key);
    }
    return cookie.value;
  }

  public extractUserId(): string {
    try {
      return this.cookieUserId;
    } catch (e) {
      if (this.challenge === null) {
        throw new IgUserIdNotFoundError();
      }
      return String(this.challenge);
    }
  }

  public async deserializeCookieJar(cookies: string | CookieJar.Serialized) {
    this.cookieJar['_jar'] = await Bluebird.fromCallback(cb => CookieJar.deserialize(cookies, this.cookieStore, cb));
  }

  public async serializeCookieJar(): Promise<CookieJar.Serialized> {
    return Bluebird.fromCallback(cb => this.cookieJar['_jar'].serialize(cb));
  }

  public async serialize(): Promise<{ cookies } & any> {
    const obj = {
      cookies: JSON.stringify(await this.serializeCookieJar()),
    };
    for (const [key, value] of Object.entries(this)) {
      obj[key] = value;
    }
    return obj;
  }

  public async deserialize(state: string | any): Promise<void> {
    State.stateDebug(`Deserializing state of type ${typeof state}`);
    const obj = typeof state === 'string' ? JSON.parse(state) : state;
    if (typeof obj !== 'object') {
      State.stateDebug(`State deserialization failed, obj is of type ${typeof obj} (object expected)`);
      throw new TypeError('State isn\'t an object or serialized JSON');
    }
    State.stateDebug(`Deserializing ${Object.keys(obj).join(', ')}`);
    if (obj.cookies) {
      await this.deserializeCookieJar(obj.cookies);
      delete obj.cookies;
    }
    for (const [key, value] of Object.entries(obj)) {
      this[key] = value;
    }
  }
}