# Family Page - Server Setup

## Endpoints

#### `/`
- `GET`
  - status message response for dev only

#### `/messages`
- `GET`
  - array of photos and announcements in current family
- `POST`
  - message body containing one photo or announcement object

### Message Sample Object
```js
{
  "_id": "589b9c6705ae9f0d9cbd165d",
  "url": "http://lorempixel.com/900/400/nightlife",
  "text": "Grandma playing beach volleyball",
  "userId": "Alex",
  "contentType": "photo" / "announcement",
  "tags": [
    "Ben",
    "Alex"
  ],
  "date": "2017-02-08T22:32:07.298Z",
  "comments": [
    {
      "from": 'Jamie',
      "to": 'Ben',
      "comment": 'my nephew is getting tall',
      "posted": Date.now
    },
    {
      "from": 'Ben',
      "to": 'Jamie',
      "comment": 'wow he is big for his age!',
      "posted": Date.now
    },
    {
      "from": 'Jamie',
      "to": 'Lauryn',
      "comment": 'what size does Jaxson wear?',
      "posted": Date.now
    },
    {
      "from": 'Lauryn',
      "to": 'Jamie',
      "comment": '1year old clothes?',
      "posted": Date.now
    },
  ];
}


```

#### `/members`
- `GET`
  - array of family member objects, including currently logged in member
- `POST`
  - message body containing new family member info

### Members Sample Object
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
