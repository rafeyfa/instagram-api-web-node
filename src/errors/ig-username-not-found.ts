import { IgClientError } from './ig-client.error';

export class IgUsernameNotFound extends IgClientError {
    constructor() {
        super(`IgUsernameNotFound`);
    }
}
