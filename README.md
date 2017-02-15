# Family Page - Server Setup

## Endpoints

#### `GET /`
- status message response for dev only

#### `GET /messages`
- array of photos and announcements in current family

#### `POST /messages`
- create new photo, announcement document
- body:

```json
// required: contentType, userId
{
  "contentType": ["photo", "announcement"],
  "text": "Caption or announcement text",
  "tags": ["tag1", "tag2"],
  "userId": "user ID/name",
  "url": ["http://photo.com/photo.jpg"]
}
```

#### `DELETE /messages/:messageId/:user`
- remove specified messageId
- TODO reverse order for consistency

#### `GET /members`
- array of family member objects, including currently logged in member

#### `POST  /members`
- message body containing new family member info

### Members Sample Object
```json
{
  "_id": "589bad649d2632109af8bbe7",
  "email": "bfletch@gmail.com",
  "fullname": "Ben Fletcher",
  "nickname": "Ben",
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
    },
    {
      "from": "Jamie",
      "to": "Lauryn",
      "text": "what size does Jaxson wear?",
      "posted": "Date.now"
    },
    {
      "from": "Lauryn",
      "to": "Jamie",
      "text": "1 year old clothes?",
      "posted": "Date.now"
    },
  ]
}
```
