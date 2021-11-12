import { Repository } from '../core/repository';
import {
    AccountRepositoryLoginResponseRootObject , ChallengeStateResponse, MediaInfoResponseRootObject, UserRepositoryInfoResponseRootObject, UserRepositoryInfoResponseUser} from '../responses';
import {
    IgRecaptchaResponseError} from '../errors';
// @ts-ignore
import { defaultsDeep } from 'lodash';
// @ts-ignore
import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import { AccountRepositoryCurrentUserResponseRootObject } from 'src/responses/account.repository.current-user.response';
export class Instagram extends Repository {
    public request: request;
    //private static accountDebug = debug('ig:account');

    public async setCookieForFirst(){
        this.request = request.defaults({
            baseUrl: this.client.state.host,
            uri: '',
            headers:{
                'User-Agent': this.client.state.webUserAgent,
                'Accept-Language': this.client.state.language || 'en-US',
                'X-Instagram-AJAX': 1,
                'X-Requested-With': 'XMLHttpRequest',
                Referer: this.client.state.host
            },
            jar: this.client.state.cookieJar,
            json: true
        })
        let value: string;
        this.request('/', { resolveWithFullResponse: true }).then(res => {
            const pattern = new RegExp(/(csrf_token":")\w+/)
            const matches = res.toJSON().body.match(pattern)
            value = matches[0].substring(13)
        })
        this.client.state.csrftoken = value;
        this.request = this.request.defaults({
            headers:{
                'x-csrftoken': this.client.state.csrftoken
            }
        })
    }
    public async login(username: string, password: string): Promise<AccountRepositoryLoginResponseRootObject> {
        const createEncPassword = pwd => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`
        }
        
        let _sharedData: any;
        try {
           const response = await this.client.request.send<AccountRepositoryLoginResponseRootObject>({
                method: 'POST',
                url: '/accounts/login/ajax/',
                form: {
                    username,
                    enc_password: createEncPassword(password),
                    queryParams: {},
                    optIntoOneTap: 'false'
                },
            });
            const sharedData = await this._getSharedData('/challenge/');
            if(sharedData.entry_data.hasOwnProperty("Challenge")){
                _sharedData = sharedData.entry_data.Challenge[0];
                if (_sharedData.challengeType == "RecaptchaChallengeForm") {
                    throw new IgRecaptchaResponseError();
                }
            }
            return response.body;
        } catch (error) {
            throw (error);
        }
        //return response.body.logged_in_user;
    }
    public async getUserByUsername(username) {
        return this.request({
          uri: `/${username}/?__a=1`,
          headers: {
            referer: this.client.state.host + '/' + username + '/',
            'x-instagram-gis': await this._getGis(`/${username}/`)
          }
        }).then(data => data.graphql.user)
    }
    public async _getGis(path) {
        const { rhx_gis } = await this._getSharedData(path);
        return crypto.createHash('md5').update(`${rhx_gis}:${path}`).digest('hex')
    }
    
    public async follow(userId) {
        const { body } = await this.client.request.send({
            method: 'POST',
            url: `/web/friendships/${userId}/follow/`
        })
        return body;
    }
    public async like(mediaId) {
        const { body } = await this.client.request.send({
            method: 'POST',
            url: `/web/likes/${mediaId}/like/`
        })
        return body;
    }
   public async  getMediaByShortcode({ shortcode }) {
        return this.request(`/p/${shortcode}/?__a=1`).then(
          data => data.graphql.shortcode_media
        )
    }
    public async getActivity() {
        const { body } = await this.client.request.send({
            url: '/accounts/activity/?__a=1'
        })
        return body.graphql.user
    }
    public async UserInfo(id: string | number): Promise<UserRepositoryInfoResponseUser> {
        const { body } = await this.client.request.sendAppVersion<UserRepositoryInfoResponseRootObject>({
          url: `/users/${id}/info/`,
        });
        return body.user;
    }
    public async MediaInfo(mediaId: string): Promise<MediaInfoResponseRootObject> {
        const { body } = await this.client.request.sendAppVersion<MediaInfoResponseRootObject>({
          url: `/media/${mediaId}/info/`,
          method: 'GET',
          form: this.client.request.sign({
            igtv_feed_preview: false,
            media_id: mediaId,
            _csrftoken: this.client.state.cookieCsrfToken,
            _uid: this.client.state.cookieUserId,
            _uuid: this.client.state.uuid,
          }),
        });
        return body;
    }
    public async currentUser() {
        const { body } = await this.client.request.sendAppVersion<AccountRepositoryCurrentUserResponseRootObject>({
          url: '/accounts/current_user/',
          qs: {
            edit: true,
          },
        });
        return body.user;
      }
    public async BypassChallenge(choice: string, isReplay = false) {
        let url: string = '/challenge/';
        const { body } = await this.client.request.sendAppVersion<ChallengeStateResponse>({
          url,
          method: 'POST',
          form: this.client.request.sign({
            choice,
            _csrftoken: this.client.state.cookieCsrfToken || this.client.state.csrftoken,
            guid: this.client.state.uuid,
            device_id: this.client.state.deviceId,
          }),
        });
        return body;
     }
    public async getProfile() {
        const { body } = await this.client.request.send({ 
            url: '/accounts/edit/?__a=1'
        });
        return body.form_data;
    }
    public async _getSharedData(url = '/') {
        return this.request(url).then(
                html => html.split('window._sharedData = ')[1].split(';</script>')[0]
            )
            .then(_sharedData => JSON.parse(_sharedData))
    }
}