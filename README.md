# **Referral System Documentation**

Open in postman - `postman.zip`, import the collection

API Url: https://15u2xzh0bk.execute-api.us-east-2.amazonaws.com/prod

## **Setup**

- Installation `npm install`
- Run unit tests `npm test`
- Run integration tests `API_URL=https://15u2xzh0bk.execute-api.us-east-2.amazonaws.com/prod npm run test:e2e`
- Deploy `cdk deploy`
- Destroy `cdk destroy`

## **Overview**

The Referral API enables users to create and manage referral requests, validate them, and complete the lifecycle when a referred user signs up. It includes functionality for tracking referral status and handling referral links.

---

## **Referral Lifecycle**

1. **Create a Referral Request**:

   - A referrer creates a referral request using their unique user ID and referral code.
   - A new client referral code is generated, and the status is set to `pending`.

2. **Deferred Deep Link (Redirect to App Store)**:

   - The referral code is embedded in a link shared with the referred user.
   - When the link is clicked on a mobile device, it redirects the user to the appropriate app store, if its not a supported platform (meaning not android or ios) it returns a 400

3. **Verify Referral**:

   - Before signing up with the referral code, the client will verify the referral code is valid and not expired.
   - The status transitions from `pending` to `verified`.

4. **Complete Referral**:

   - After successful verification AND sign up, the client will completed the referral.
   - The status transitions from `verified` to `completed`.

5. **Expired Referrals**:
   - If the referred user does not act within the expiration period (7 days), the referral transitions to `expired` and will eventually be deleted from the database, any attempts to verify or complete the referral code will return a 409

---

## **API Endpoints**

### **1. Create Referral Request**

**POST /referral/request**

- **Description**: Create a new referral request.
- **Errors**:
  - `400`: Missing name in body
  - `500`: Something went wrong
- **Request Body**:
  ```json
  {
    "name": "Peter"
  }
  ```
- **Response**:
  ```json
  {
    "referralRequest": {
      "name": "Peter",
      "parentReferralCode": "123456",
      "expiresAt": "2025-01-21T21:02:35.395Z",
      "status": "PENDING",
      "createdAt": "2025-01-14T21:02:35.395Z",
      "code": "862c9a81-1304-40f9-b418-a02b634cd9d8"
    }
  }
  ```

---

### **2. Handle Referral Link**

**GET /link**

- **Description**: Handle a referral link click and redirect to the appropriate destination based on the platform.
- **Query Parameters**:
  - `code`: Referral code from the link.
  - `parentReferralCode`: The parent referral code from the request.
- **Response**:
  - `302 Found`: Redirect to the app store or web page.
  - `400 Bad Request`: Invalid or missing referral code or an unsupported platform

---

### **3. Verify Referral**

**POST /referral/verify**

- **Description**: Verify the referral code after a user signs up.
- **Errors**:
  - `400`: Missing referral code
  - `409`: Referral is in an invalid state, cannot be verified
  - `500`: Something went wrong
- **Request Body**:
  ```json
  {
    "code": "862c9a81-1304-40f9-b418-a02b634cd9d8"
  }
  ```
- **Response**:
  ```json
  {
    "referralRequest": {
      "parentReferralCode": "123456",
      "code": "862c9a81-1304-40f9-b418-a02b634cd9d8",
      "status": "VERIFIED",
      "name": "Peter",
      "createdAt": "2025-01-14T21:02:35.395Z",
      "expiresAt": "2025-01-21T21:02:35.395Z"
    }
  }
  ```

---

### **4. Complete Referral**

**POST /referral/complete**

- **Description**: Mark a referral as completed after verification.
- **Errors**:
  - `400`: Missing referral code
  - `409`: Referral is in an invalid state, cannot be completed
  - `500`: Something went wrong
- **Request Body**:
  ```json
  {
    "code": "862c9a81-1304-40f9-b418-a02b634cd9d8"
  }
  ```
- **Response**:
  ```json
  {
    "referralRequest": {
      "parentReferralCode": "123456",
      "code": "862c9a81-1304-40f9-b418-a02b634cd9d8",
      "status": "COMPLETED",
      "name": "Peter",
      "createdAt": "2025-01-14T21:02:35.395Z",
      "expiresAt": "2025-01-21T21:02:35.395Z"
    }
  }
  ```

---

### **5. List Referrals**

**GET /referral/list**

- **Description**: Retrieve all referrals associated with the authenticated user.
- **Errors**:
  - `500`: Something went wrong
- **Response**:
  ```json
  {
    "referralRequests": [
      {
        "parentReferralCode": "123456",
        "code": "14f54178-1ad7-403d-a1ec-3eb67a0b191d",
        "status": "PENDING",
        "name": "Peter",
        "createdAt": "2025-01-14T20:53:09.643Z",
        "expiresAt": "2025-01-21T20:53:09.643Z"
      },
      {
        "parentReferralCode": "123456",
        "code": "22fa91c2-d543-466c-9f44-061019a39a44",
        "status": "COMPLETED",
        "name": "Dale",
        "createdAt": "2025-01-13T16:15:38.873Z",
        "expiresAt": "2025-01-20T16:15:38.873Z"
      }
    ]
  }
  ```

---

## **Referral Statuses**

1. **`pending`**: Referral is created and awaiting action from the referred user.
2. **`verified`**: Referral is validated BEFORE the user signs up.
3. **`completed`**: Referral is successfully completed after the user signs up.
4. **`expired`**: Referral has passed its expiration time without being acted upon.

---

## **Authorization**

- Public endpoints:
  - `/link`
- Secured endpoints:
  - `/referral/request`
  - `/referral/verify`
  - `/referral/complete`
  - `/referral/list`

---

## Mobile App Flows

---

### **1. Get a List of Referrals**

- **Action**: Fetch the list of referrals for the logged-in user to display in the app.
- **Purpose**: Allow the user to view their referral history, including statuses (`pending`, `verified`, `completed`, `expired`).
- **API Endpoint**: `GET /referral/list`

---

### **2. Create a Referral**

- **Action**: User initiates the creation of a new referral request.
- **Purpose**: Generate a referral request
- **Flow**:
  1. App sends the request to the backend.
  2. App receives the referral request.
- **API Endpoint**: `POST /referral/request`

---

### **3. Send the Referral Link**

- **Action**: Allow the user to share the referral link via messaging apps, email, or social media.
- **Purpose**: Ensure the referred user receives the referral link containing the referral code.
- **Flow**:
  1. App constructs the referral link: `https://<base-url>/link?parentReferralCode=<parentReferralCode>&code=<referralCode>`.
  2. App opens the native sharing UI to send the link to the user

---

### **4. Handle the Referral Link**

- **Action**: When the referred user clicks the link on a mobile device, the app processes it.
- **Purpose**: Redirect the referred user to the appropriate app store
- **Flow**:
  1. App detects the referral link via deferred deep linking.
  2. App extracts the `code` and the `parentReferralCode` from the link.

---

### **5. Verify the Referral**

- **Action**: The app verifies the referral code before the referred user completes the signup.
- **Purpose**: Ensure the referral code is valid and applicable to the current signup process.
- **Flow**:
  1. During the signup flow, the app sends the `code` to the backend for verification.
  2. Backend validates the referral and returns a success/failure response.
- **API Endpoint**: `POST /referral/verify`

---

### **6. User Signs Up**

- **Action**: The referred user completes the signup process in the app.
- **Purpose**: Register the user and associate their profile with the referral code.
- **Flow**:
  1. App submits the signup details along with the `referralCode`.

---

### **7. Complete the Referral Request**

- **Action**: After signup, the app completes the referral request.
- **Purpose**: Finalize the referral process, updating the status to `completed` and issuing rewards (if applicable).
- **Flow**:
  1. App calls the backend to mark the referral as completed using the same `code` and `parentReferralCode` as the signup
- **API Endpoint**: `POST /referral/complete`
