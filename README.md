# Family Page - Server Setup

## Endpoints

#### `/`
- `GET`
  - status message response for dev only

#### `/photos`
- `GET`
  - array of photos in current family
- `POST`
  - message body containing one photo object

### Photo Sample Object
```js
{
  "_id": "589b9c6705ae9f0d9cbd165d",
  "url": "http://lorempixel.com/900/400/nightlife",
  "caption": "Grandma playing beach volleyball",
  "userId": "Alex",
  "tags": [
    "Ben",
    "Alex"
  ],
  "date": "2017-02-08T22:32:07.298Z"
}
```

#### `/members`
- `GET`
  - array of family member objects, including currently logged in member
- `POST`
  - message body containing new family member info

### People Sample Object
```js
{
  "_id": "589bad649d2632109af8bbe7",
  "email": "bfletch@gmail.com",
  "fullname": "Ben Fletcher",
  "nickname": "Ben",
  "avatar": "https://avatars3.githubusercontent.com/u/14811503",
  "__v": 0
}
```
