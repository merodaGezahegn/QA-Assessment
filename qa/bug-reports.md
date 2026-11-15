
cat > qa/bug-reports.md <<'EOF'
# Bug Reports – Ella Tech E-commerce API

**Project:** Ella Tech E-commerce API  
**Module:** Users  
**Test Environment:** Local Development  
**Test Date:** 15 November 2026  
**Status:** Both defects fixed and retested

---

## BUG-001: API accepts invalid email addresses during user creation

**Bug ID:** DEF-001  
**Title:** User creation accepts an invalid email address  
**Severity:** Medium  
**Priority:** High  
**Module:** Users  
**HTTP Method:** POST  
**Endpoint:** `/users`  
**Status:** Fixed and retested

### Description

The API accepted an invalid email address during user registration and returned HTTP 201 Created. This allowed user records with incorrectly formatted email addresses to be stored in the database.

### Preconditions

- The API server is running.
- The database is connected.
- The supplied email address has not already been registered.

### Steps to Reproduce

1. Open a terminal or API client.
2. Send a POST request to `/users`.
3. Provide a valid name and an incorrectly formatted email address.
4. Observe the HTTP response.

### Request Payload

```json
{
  "name": "Invalid Email User",
  "email": "not-an-email"
}
```

### cURL Command

```bash
curl -i -X POST http://localhost:4000/users \
-H "Content-Type: application/json" \
-d '{"name":"Invalid Email User","email":"not-an-email"}'
```

### Expected Result

The API should reject the request and return:

- HTTP 400 Bad Request
- A validation message indicating that the email address is invalid.
- No user record should be created.

### Actual Result Before Fix

The API returned:

- HTTP 201 Created
- A new user record was created with the invalid email address.

### Root Cause

The `email` property in `CreateUserDto` did not have an email-format validation decorator.

### Fix Implemented

Added the `@IsEmail()` validator to the email property in `src/users/dto/create-user.dto.ts`.

### Retest Result

The same request was executed after the fix.

The API returned:

```json
{
  "message": [
    "Please provide a valid email address"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Final Status:** PASS – Defect fixed and verified.

---

## BUG-002: Non-numeric user IDs cause internal server errors

**Bug ID:** DEF-002  
**Title:** User endpoints return HTTP 500 for non-numeric IDs  
**Severity:** Medium  
**Priority:** High  
**Module:** Users  
**HTTP Methods:** GET and PUT  
**Affected Endpoints:**
- `GET /users/:id`
- `PUT /users/:id`

**Status:** Fixed and retested

### Description

The API returned HTTP 500 Internal Server Error when a non-numeric user ID, such as `abc`, was supplied to the user retrieval endpoint.

The same issue affected the user update endpoint.

### Preconditions

- The API server is running.
- The database is connected.

### Steps to Reproduce – GET

1. Open a terminal or API client.
2. Send a GET request to `/users/abc`.
3. Observe the HTTP response.

### Request

```http
GET /users/abc
```

### cURL Command

```bash
curl -i http://localhost:4000/users/abc
```

### Expected Result

The API should validate the ID and return:

- HTTP 400 Bad Request
- A validation message indicating that a numeric string is expected.

### Actual Result Before Fix

The API returned:

```json
{
  "statusCode": 500,
  "message": "Error retrieving user",
  "error": "invalid input syntax for type integer: \"NaN\""
}
```

### Steps to Reproduce – PUT

1. Send a PUT request to `/users/abc`.
2. Provide a valid update payload.
3. Observe the HTTP response.

### Request Payload

```json
{
  "name": "Updated Name",
  "email": "qa.test@example.com"
}
```

### cURL Command

```bash
curl -i -X PUT http://localhost:4000/users/abc \
-H "Content-Type: application/json" \
-d '{"name":"Updated Name","email":"qa.test@example.com"}'
```

### Root Cause

The controller converted the incoming ID using `Number(id)` without validating whether the supplied value was numeric.

As a result, an input such as `abc` became `NaN` and was passed to the service and database.

### Fix Implemented

Added NestJS `ParseIntPipe` to the ID parameters in both controller methods:

- `findOne()`
- `update()`

This validates the route parameter before the service method is called.

### Retest Results

| Endpoint | Test Input | Expected | Actual |
|---|---|---|---|
| GET /users/abc | abc | 400 | 400 |
| PUT /users/abc | abc | 400 | 400 |
| GET /users/1 | 1 | 200 | 200 |
| PUT /users/1 | 1 | 200 | 200 |

**Final Status:** PASS – Defect fixed and verified.

---

## Overall Bug Summary

| Bug ID | Description | Severity | Status |
|---|---|---|---|
| DEF-001 | Invalid email accepted during user creation | Medium | Fixed |
| DEF-002 | Non-numeric user IDs caused HTTP 500 errors | Medium | Fixed |

**Total defects identified:** 2  
**Total defects fixed:** 2  
**Total defects retested:** 2

Both defects were identified during exploratory and functional testing of the Users module. Fixes were implemented and verified through subsequent API requests.
EOF

---

## BUG-003: Product update assigns quantity to the price field

**Bug ID:** DEF-003  
**Title:** Updating product quantity incorrectly changes its price  
**Severity:** High  
**Priority:** High  
**Module:** Products  
**HTTP Method:** PUT  
**Endpoint:** `/products/1`  
**Status:** Confirmed by API testing

### Description

When updating a product, the API assigns the submitted quantity to the product price field instead of using the submitted price.

### Preconditions

A product exists with price 100 and quantity 10.

### Steps to Reproduce

1. Create a product with price 100 and quantity 10.
2. Send a PUT request to `/products/1`.
3. Submit price 100 and quantity 5.
4. Retrieve the product using GET `/products/1`.

### Request Payload

```json
{
  "name": "QA Test Product",
  "price": 100,
  "quantity": 5,
  "status": "FOR_SALE"
}
```

### Expected Result

The product should retain price 100 and have quantity 5.

### Actual Result

The API returned HTTP 200, but the saved product had price 5 and quantity 5.

### Root Cause

In `src/products/products.service.ts`, the update method contains:

```typescript
product.price = dto.quantity ?? product.price;
```

### Recommended Fix

Replace the assignment with:

```typescript
product.price = dto.price ?? product.price;
```

**Final Status:** Confirmed – Fix not yet applied.

---

## BUG-004: Creating a transaction increases product stock instead of reducing it

**Bug ID:** DEF-004  
**Title:** Product stock increases after a sales transaction  
**Severity:** Critical  
**Priority:** High  
**Module:** Transactions  
**HTTP Method:** POST  
**Endpoint:** `/transactions`  
**Status:** Confirmed by API testing

### Description

When a transaction is created, the API increases the product stock quantity by the transaction quantity. For a normal sales transaction, stock should decrease.

### Preconditions

- A user with ID 1 exists.
- A product with ID 1 exists.
- The product has stock quantity 5.

### Steps to Reproduce

1. Retrieve product ID 1 and confirm its stock quantity is 5.
2. Create a transaction for user ID 1 and product ID 1.
3. Set the transaction quantity to 2.
4. Retrieve product ID 1 again.
5. Compare the actual stock with the expected stock.

### Request Payload

```json
{
  "userId": 1,
  "productId": 1,
  "quantity": 2
}
```

### Expected Result

The transaction should be created successfully and product stock should decrease from 5 to 3.

### Actual Result

The transaction returned HTTP 201 Created, but product stock increased from 5 to 7.

### Root Cause

In `src/transactions/transactions.service.ts`, the stock update uses:

```typescript
product.quantity += dto.quantity;
```

### Recommended Fix

For a sales transaction, replace the operation with:

```typescript
product.quantity -= dto.quantity;
```

The stock status should also be updated when quantity reaches zero.

**Final Status:** Confirmed – Fix not yet applied.

---

## Additional Defect Summary

| Bug ID | Description | Severity | Status |
|---|---|---|---|
| DEF-003 | Product update changes price using quantity | High | Confirmed |
| DEF-004 | Transaction increases stock instead of reducing it | Critical | Confirmed |

