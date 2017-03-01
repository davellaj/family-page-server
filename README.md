# Family Page - Server Setup

## Endpoints

#### `GET /:familyId/messages`
- array of photos and announcements in current family

#### `POST /:familyId/messages`
- create new photo, announcement document

```js
body = {
  "contentType": ["photo", "announcement"],
  "text": "Caption or announcement text",
  "tags": ["tag1", "tag2"],
  "userId": "user ID/name",
  "url": ["http://photo.com/photo.jpg"]
}
```

#### `GET /user`
- returns info regarding currently authenticated user

```json
{
  "currentUser": {
    "id": "user id",
    "avatar": "string URL",
    "nickname": "user first/nick name",
    "fullname": "user fullname",
    "families": [
      {
        "familyId": "family id",
        "familyName": "The Davella's",
        "admin": ["user id of creator/admins"],
        "familyAvatar": "photo url"
      }
    ]
  }
}
```

#### `DELETE /messages/:messageId`
- remove specified messageId (if authorized)

#### `GET /:familyId/members`
- array of family member objects, including currently logged in member

#### `POST  /:familyId/members`
- add new authorized family member to familyId
- authorize that current user is Admin for family

```json
{
  "newUser": "email address string",
  "isAdmin":  false
}
```

### Members Sample Object
```json
{
  "_id": "589bad649d2632109af8bbe7",
  "email": "johndoe@gmail.com",
  "fullname": "John Doe",
  "nickname": "John",
  "avatar": "https://avatars3.githubusercontent.com/u/14811503",
}
```

#### `POST /comments/:userId/:messageId`
- create new comment on designated messageId
- userId will be used to set 'from' field of document TODO

##### Body:

```json
  "from": "Name/ID",
  "to": "name/id",
  "text": "comment text"
```

#### `DELETE /comments/:userId/:messageId/:commentId`
- delete designated comment from designated message

### Message Sample Object
```json
{
  "_id": "589b9c6705ae9f0d9cbd165d",
  "url": "http://lorempixel.com/900/400/nightlife",
  "text": "Grandma playing beach volleyball",
  "userId": "Alex",
  "contentType": ["photo", "announcement"],
  "tags": [
    "Ben",
    "Alex"
  ],
  "date": "2017-02-08T22:32:07.298Z",
  "comments": [
    {
      "from": "Jamie",
      "to": "Ben",
      "text": "my nephew is getting tall",
      "posted": "Date.now()"
    },
    {
      "from": "Ben",
      "to": "Jamie",
      "text": "wow he is big for his age!",
      "posted": "Date.now"
    }
  ]
}
```
