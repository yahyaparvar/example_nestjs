#

## Install 🚀

run

```
yarn
```

then

```
yarn start
```

#

## 🌟 Endpoints

**Note: Sorry for missing the test units.**

- [1. Create User](#create)
- [2. Get User by ID](#get)
- [3. Get User Avatar](#avatar)
- [4. Delete User Avatar](#delete-avatar)

## Environment Variables

Set up your `.env` file with the following environment variables:

```env
MONGODB_URI= YOUR_MONGODB_URI
SMTP_HOST= YOUR_SMTP_HOST
SMTP_PORT= YOUR_SMTP_PORT
SMTP_USER= YOUR_SMTP_USER
SMTP_PASS= YOUR_SMTP_PASS
RABBITMQ_URI= YOUR_RABBITMQ_URI
```

## cURL Commands

### <a name="create">1. Create User</a>

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john.doe@example.com"}'
```

### <a name="get">2. Get User by ID</a>

```bash
curl -X GET http://localhost:3000/api/users/2
```

### <a name="avatar">3. Get User Avatar</a>

```bash
curl -X GET http://localhost:3000/api/users/2/avatar
```

### <a name="delete-avatar">4. Delete User Avatar</a>

```bash
curl -X DELETE http://localhost:3000/api/users/2/avatar
```
