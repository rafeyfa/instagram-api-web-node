"use strict"
const { IgApiClient } = require("../build");

const instagram = new IgApiClient();
(async () => {
try{
    const username = "";
    const password = "";
    await instagram.ig.setCookieForFirst();
    const login = await instagram.ig.login(username, password);

    const follow = await instagram.ig.getUserByUsername("bp_bayupratamaxxx");
    console.log(follow);
} catch (error){
    console.log(error.name)
}
})();
