# instagram-api-web
Recode from :
- https://github.com/dilame/instagram-private-api
- https://github.com/jlobos/instagram-web-api
# How to install
```bash
npm i instagram-web-api-node
```
# How to use
```node
const { IgApiClient } = require("instagram-web-api-node");
function save(data){
  let cookie = JSON.stringify(data); 
  //save cookie to file or database after 
  //code save
  return cookie;
}
(async () => { 
  try {
      const instagram = new IgApiClient();
      // This function executes after every request
      instagram.request.end$.subscribe(async () => {
        const serialized = await instagram.state.serialize();
        save(serialized); 
      });
      //set login account
      const { username, password } = process.env; 
      await instagram.ig.state.generateDevice(); 
      //login use account username and password
      await instagram.ig.login(username, password);
  } catch (error){
      console.log(error.name)
  }
})();
  ```
# How to login without username and password
```node
const { IgApiClient } = require("instagram-web-api-node");
(async () => { 
  try {
      const instagram = new IgApiClient();
      await instagram.state.deserialize(cookie); //cookiejson
      
      const follow = instagram.ig.follow(userid);
  } catch (error){
      console.log(error.name)
  }
  ```
