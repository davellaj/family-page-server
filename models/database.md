# Database Structure

(all resides in one Family for MVP)

- Users
  - Avatar (URL to headshot) (maybe get from G+ ?)
  - Name
  - Auth token

- Photos
  - URL stored as string
  - Alt-text / caption
  - User ID (who posted)
  - Responses on photos
    - Between two users
    - From (to is always photo poster)

```js
photo = {
  url: "http://www.imgur.com/coolphoto12534.jpg",
  caption: "new kid photo",
  userId: jamie,
  responses: {
    casey: [
      {
        from: casey,
        to: jamie,
        content: "he's getting so big!"
      },
      {
        from: jamie,
        to: casey,
        content: "I know, he eats all the time!"
      }
    ],
    ben: [
      {
        from: ben,
        to: jamie,
        content: "wow, cute kid!"
      }
    ]
  }

}
```
