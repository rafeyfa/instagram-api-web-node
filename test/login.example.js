"use strict"
const { IgApiClient } = require("../build");

const instagram = new IgApiClient();
(async () => {
try{
    const username = "sadina6179";
    const password = "sadina689835";
    await instagram.ig.setCookieForFirst();
    const login = await instagram.ig.login(username, password);

    const follow = await instagram.ig.getUserByUsername("bp_bayupratamaxxx");
    console.log(follow);
} catch (error){
    console.log(error.name)
}
})();