import { Repository } from '../core/repository';
import {
    AccountRepositoryLoginResponseRootObject} from '../responses';
import {
    IgClientError,
    IgLoginRequiredError, IgRecaptchaResponseError, IgRequestsLimitError, IgUsernameNotFound
} from '../errors';
// @ts-ignore
import { defaultsDeep } from 'lodash';
// @ts-ignore
import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import {Response} from "request";
export class Instagram extends Repository {
    public request: request;
    //private static accountDebug = debug('ig:account');
    public async login(username: string, password: string): Promise<AccountRepositoryLoginResponseRootObject> {
        const createEncPassword = pwd => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${pwd}`
        }
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
        await this.request('/', { resolveWithFullResponse: true }).then(res => {
            const pattern = new RegExp(/(csrf_token":")\w+/)
            const matches = res.toJSON().body.match(pattern)
            value = matches[0].substring(13)
        })
        this.client.state.csrftoken = value;
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
    public async getUserByUsername(username: string) {
        try {
            let graphql: any;
             graphql = await this.client.request.send({
                url: `/${username}/?__a=1`,
                headers: {
                    referer: this.client.state.host + '/' + username + '/',
                    'x-instagram-gis': await this._getGis(`/${username}/`)
                }
            })
            return graphql.user;
        } catch (error) {
            const err = await this.handleErrorCode(error);
            throw err;
        }
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
            url: `/web/like/${mediaId}/like/`
        })
        return body;
    }
    private handleErrorCode(response: Response): IgClientError {
        if (response.statusCode == 404) {
            return new IgUsernameNotFound();
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
    }
    public async getMediaByShortcode(shortcode: string) {
        try {
            let graphql: any;
            graphql = await this.client.request.send({
                url: `/p/${shortcode}/?__a=1`
            })
            return graphql.shortcode_media;
        } catch (error) {
            const err = await this.handleErrorCode(error);
            throw err;
        }
    }
    public async getActivity() {
        const { body } = await this.client.request.send({
            url: '/accounts/activity/?__a=1'
        })
        return body.graphql.user
    }

    public async getProfile() {
        return this.request('/accounts/edit/?__a=1').then(data => data.form_data)
    }
    public async _getSharedData(url = '/') {
        return this.request(url)
            .then(
                html => html.split('window._sharedData = ')[1].split(';</script>')[0]
            )
            .then(_sharedData => JSON.parse(_sharedData))
    }
}