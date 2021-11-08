import { State } from './state';
import { Request } from './request';
import { Instagram } from '../repositories/Instagram';
export class IgApiClient {
    public state = new State();
    public request = new Request(this);
    public ig = new Instagram(this);

    public destroy() {
        this.request.error$.complete();
        this.request.end$.complete();
    }
}