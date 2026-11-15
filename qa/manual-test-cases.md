# Manual Test Cases – Users Module

**Project:** Ella Tech E-commerce API  
**Module:** Users  
**Test Date:** 15 November 2026  
**Tester:** QA Assessment Candidate  
**Environment:** Local development environment  
**Base URL:** http://localhost:4000

## Test Cases

| ID | Test Scenario | Method | Endpoint | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| USR-001 | Create a valid user | POST | /users | {"name":"QA Test User","email":"qa.test@example.com"} | 201 Created | User created successfully | PASS |
| USR-002 | Create user with duplicate email | POST | /users | Existing email: qa.test@example.com | 409 Conflict | 409 Conflict | PASS |
| USR-003 | Create user without email | POST | /users | {"name":"Test User"} | 400 Bad Request | 400 Bad Request | PASS |
| USR-004 | Create user with invalid email | POST | /users | {"name":"Invalid Email User","email":"not-an-email"} | 400 Bad Request | Initially 201; after fix 400 | PASS AFTER FIX |
| USR-005 | Create user with numeric name | POST | /users | {"name":12345,"email":"numeric.name@example.com"} | 400 Bad Request | 400 Bad Request | PASS |
| USR-006 | Retrieve all users | GET | /users | No body | 200 OK | 200 OK | PASS |
| USR-007 | Retrieve existing user | GET | /users/1 | User ID: 1 | 200 OK | 200 OK; user details returned | PASS |
| USR-008 | Retrieve nonexistent user | GET | /users/9999 | User ID: 9999 | 404 Not Found | 404 Not Found | PASS |
| USR-009 | Retrieve user with non-numeric ID | GET | /users/abc | User ID: abc | 400 Bad Request | Initially 500; after fix 400 | PASS AFTER FIX |
| USR-010 | Update user with non-numeric ID | PUT | /users/abc | User ID: abc | 400 Bad Request | 400 Bad Request after fix | PASS AFTER FIX |
| USR-011 | Update existing user | PUT | /users/1 | {"name":"QA Test User Updated","email":"qa.test@example.com"} | 200 OK | 200 OK; name updated | PASS |

## Defects Identified

### DEF-001: Invalid email accepted during user creation

- **Severity:** Medium
- **Endpoint:** POST /users
- **Original behavior:** An invalid email address was accepted and the API returned 201 Created.
- **Expected behavior:** The API should reject invalid email formats with 400 Bad Request.
- **Root cause:** The email field did not have an email-format validation decorator.
- **Fix:** Added the `@IsEmail()` validator to CreateUserDto.
- **Retest result:** 400 Bad Request.
- **Status:** Fixed and retested.

### DEF-002: Non-numeric user IDs caused internal server errors

- **Severity:** Medium
- **Affected endpoints:** GET /users/:id and PUT /users/:id
- **Original behavior:** Sending a non-numeric ID such as `abc` caused a 500 Internal Server Error because the controller passed `NaN` to the service/database.
- **Expected behavior:** The API should reject invalid numeric IDs with 400 Bad Request.
- **Root cause:** The controller converted the ID using `Number(id)` without validating it.
- **Fix:** Added NestJS `ParseIntPipe` to both endpoints.
- **Retest result:** Both endpoints returned 400 Bad Request for `abc`.
- **Status:** Fixed and retested.

## Test Summary

- Total documented test cases: 11
- Passed: 11
- Failed after fixes: 0
- Defects identified and fixed: 2
- Module tested: Users

**Note:** The results above include successful retests after fixes. The original failures are documented in the defect descriptions.
