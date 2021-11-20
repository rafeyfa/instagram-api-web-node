"use strict"
const { IgApiClient } = require("../build");

const client = new IgApiClient();
const { username, password } = process.env;
(async () => {
    function save(data){
        let cookie = JSON.stringify(data); 
        //save cookie to file or database after 
        //code save
        return cookie;
      }
try{
    client.request.end$.subscribe(async () => {
        const serialized = await instagram.state.serialize();
        save(serialized); //save cookie to json
    });
    const loginResponse = await client.ig.login(username, password);
    console.log(loginResponse)
    //Get Profile
    const profile = await client.ig.getProfile();
    console.log(profile);
} catch (error){
    console.log(error.name)
}
})();
