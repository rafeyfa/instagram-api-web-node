export class IgLoginTwoFactorRequiredError{
    public message: any;
    public name: any;
    constructor(message: string) {
        this.message   = message;
        this.name = "IgLoginTwoFactorRequiredError";
    }
}