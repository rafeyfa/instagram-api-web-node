export class IgRecaptchaResponseError {
    public name: string;
    public message: string;
    constructor() {
        this.name    = "IgRecaptchaResponseError";
        this.message = "RecaptchaChallengeForm";
    }
}