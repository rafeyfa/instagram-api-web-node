import { Repository } from '../core/repository';
import {
    AccountRepositoryLoginResponseRootObject , ChallengeStateResponse, MediaInfoResponseRootObject, UserRepositoryInfoResponseRootObject, UserRepositoryInfoResponseUser} from '../responses';
import {
    IgCookieNotFoundError,
    IgRecaptchaResponseError} from '../errors';
// @ts-ignore
import { defaultsDeep } from 'lodash';
// @ts-ignore
import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import { AccountRepositoryCurrentUserResponseRootObject } from 'src/responses/account.repository.current-user.response';
export class Instagram extends Repository {
    request = request.defaults({
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
    public async login(username: string, password: string): Promise<AccountRepositoryLoginResponseRootObject> {
        const createEncPassword = pwd => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`
        }
        let _sharedData: any;
        let value: string;
        this.request('/', { resolveWithFullResponse: true }).then(res => {
            const pattern = new RegExp(/(csrf_token":")\w+/)
            const matches = res.toJSON().body.match(pattern)
            value = matches[0].substring(13)
        })
        if(typeof value !== "string"){
            throw new IgCookieNotFoundError("IgCookieNotFoundError");
        }
        this.client.state.csrftoken = value;
        this.request = this.request.defaults({
            headers: { 'X-CSRFToken': value }
        })
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
            this.client.state.XinstagramAJAX  = sharedData.rollout_hash ? sharedData.rollout_hash : 1;
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
            _csrftoken: this.client.state.cookieCsrfToken || this.client.state.csrftoken,
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
    /*************** NEW ****************/
    public async GetTimelineFeed() {
       const { body } = await this.client.request.send({
            baseUrl: "https://i.instagram.com",
            url: "/api/v1/feed/timeline/",
            method: 'POST',
            form: {
                is_async_ads_in_headload_enabled: 0,
                rti_delivery_backend: 0,
                is_async_ads_rti: 0,
                is_async_ads_double_request: 0,
                device_id: this.client.state.deviceId,
            },
        });
        return body;
    }
    public async friendshipInfo(id: number) {
        const { body } = await this.client.request.send({
            baseUrl: `https://i.instagram.com`,
            url: `/api/v1/friendships/show/${id}`
        });
        return body;
    }
    public async topsearch(username: string) {
        const { body } = await this.client.request.send({
            url: `/web/search/topsearch/?context=blended&query=${username}`,
        });
        return body.users;
    }
    public async userstory(pk: number){
        const { body } = await this.client.request.send({
            baseUrl: `https://i.instagram.com`,
            url: `/api/v1/feed/user/${pk}/story/`
        });
        return body;
    }
    public async StorySeen(form){
        const { body } = await this.client.request.send({
            url: `/stories/reel/seen`,
            method: 'POST',
            headers: {
                Referer: "https://www.instagram.com/stories/dagelan/2708008864439426280/"
            },
            form
        });
        return body;
    }
    public async search_click(pk: number){
        const { body } = await this.client.request.send({
            baseUrl: `https://i.instagram.com`,
            url: `/api/v1/fbsearch/register_recent_search_click/`,
            method: 'POST',
            form: {
                entity_id: pk,
	            entity_type: "user"
            }
        });
        return body;
    }
    public async userFeed(pk: number){
        const { body } = await this.client.request.sendAppVersion({
            url: `/feed/user/${pk}/`,
            qs: {
                max_id: null,
            },
        });
        return body.items;
    }
}