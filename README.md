# Family Page - Server Setup

## Endpoints

#### `/`
- `GET`
  - status message response for dev only

#### `/photos`
- `GET`
  - array of photos in current family
- `POST`
  - message body containing one photo object in the form:

### Photo Sample Object
```js
{
  "_id": "589b9c6705ae9f0d9cbd165d",
  "url": "http://lorempixel.com/900/400/nightlife",
  "userId": "Alex",
  "tags": [
    "Ben",
    "Alex"
  ],
  "date": "2017-02-08T22:32:07.298Z"
}
```
