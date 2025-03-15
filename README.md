# Global Health Solution Server

This is the backend server for the Global Health Solution application, providing a comprehensive API for telemedicine and healthcare management.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Environment Variables](#environment-variables)
3. [API Documentation](#api-documentation)
   - [Base URL](#base-url)
   - [Authentication](#authentication)
   - [Error Handling](#error-handling)
   - [API Endpoints](#api-endpoints)
     - [User Management](#user-management)
     - [Appointments](#appointments)
     - [Calls](#calls)
     - [Medical Files](#medical-files)
     - [Blogs](#blogs)
     - [Notifications](#notifications)
     - [Payments](#payments)
     - [Chatbot](#chatbot)
     - [Profile Images](#profile-images)
4. [WebSocket Events](#websocket-events)
5. [Contributing](#contributing)
6. [License](#license)

## Getting Started

To get started with this project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run the server: `npm run dev`

## Environment Variables

Create a `.env` file in the root directory with these variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
SENDGRID_API_KEY=your_sendgrid_api_key
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

Replace with your production URL when deployed.

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

### Error Handling

All errors follow this format:

```json
{
  "message": "Error description here"
}
```

Common HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### API Endpoints

#### User Management

##### Register User
- **URL:** `POST /api/users/register`
- **Auth:** No
- **File Upload:** Yes (multipart/form-data)
- **Body:**
  ```json
  {
    "role": "user|specialist",
    "firstName": "string",
    "lastName": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "gender": "string",
    "address": "string",
    "country": "string",
    "email": "string",
    "phone": "string",
    "password": "string",
    "agreeTerms": "boolean",
    "recaptcha": "string",
    "profileImage": "file (optional)",
    "specialistCategory": "string (required for specialists)",
    "currentPracticingLicense": "file (required for specialists)",
    "isOnline": "boolean (for specialists)",
    "doctorRegistrationNumber": "string (for specialists)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "isVerified": false
    }
  }
  ```

##### Verify OTP
- **URL:** `POST /api/users/verify-otp`
- **Auth:** No
- **Body:**
  ```json
  {
    "email": "string",
    "otp": "string"
  }
  ```
- **Response:** `200 OK`

##### Login
- **URL:** `POST /api/users/login`
- **Auth:** No
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string"
    }
  }
  ```

##### Get User Profile
- **URL:** `GET /api/users/profile`
- **Auth:** Required
- **Response:** `200 OK`
  ```json
  {
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "profileImage": "string",
      "specialistCategory": "string",
      "availability": []
    }
  }
  ```

##### Update User Profile
- **URL:** `PUT /api/users/profile`
- **Auth:** Required
- **File Upload:** Yes (multipart/form-data)
- **Body:** Any user fields to update
- **Response:** `200 OK`

##### Update Availability (Specialists)
- **URL:** `PUT /api/users/availability`
- **Auth:** Required
- **Body:**
  ```json
  {
    "availability": [
      {
        "day": "string",
        "startTime": "HH:mm",
        "endTime": "HH:mm"
      }
    ]
  }
  ```
- **Response:** `200 OK`

#### Appointments

##### Create Appointment
- **URL:** `POST /api/appointments`
- **Auth:** Required
- **Body:**
  ```json
  {
    "specialistId": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:mm",
    "type": "string",
    "description": "string"
  }
  ```
- **Response:** `201 Created`

##### Get Appointments
- **URL:** `GET /api/appointments`
- **Auth:** Required
- **Query Parameters:**
  - status: pending|confirmed|completed|cancelled
  - role: user|specialist
- **Response:** `200 OK`

##### Update Appointment
- **URL:** `PUT /api/appointments/:id`
- **Auth:** Required
- **Body:**
  ```json
  {
    "status": "string",
    "notes": "string"
  }
  ```
- **Response:** `200 OK`

##### Start Appointment
- **URL:** `POST /api/appointments/:id/start`
- **Auth:** Required
- **Response:** `200 OK`
  ```json
  {
    "channelName": "string",
    "token": "string"
  }
  ```

#### Medical Files

##### Upload Medical File
- **URL:** `POST /api/medical-files`
- **Auth:** Required
- **File Upload:** Yes (multipart/form-data)
- **Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "file": "file"
  }
  ```
- **Response:** `201 Created`

##### Get Medical Files
- **URL:** `GET /api/medical-files`
- **Auth:** Required
- **Response:** `200 OK`

#### Notifications

##### Get Notifications
- **URL:** `GET /api/notifications`
- **Auth:** Required
- **Response:** `200 OK`
  ```json
  {
    "notifications": [
      {
        "_id": "string",
        "type": "string",
        "message": "string",
        "read": "boolean",
        "createdAt": "date"
      }
    ]
  }
  ```

#### Payments

##### Create Payment Intent
- **URL:** `POST /api/payments/create-payment-intent`
- **Auth:** Required
- **Body:**
  ```json
  {
    "amount": "number",
    "currency": "string",
    "appointmentId": "string"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "clientSecret": "string"
  }
  ```

#### Chatbot

##### Disease Prediction
- **URL:** `POST /api/chatbot/predict_disease`
- **Auth:** No
- **Body:**
  ```json
  {
    "question": "string"
  }
  ```
- **Description:** Send user symptoms or health-related questions to get AI-powered disease predictions and medical advice
- **Response:** `200 OK`
  ```json
  {
    "response": "string" // AI-generated response with disease prediction and advice
  }
  ```
- **Error Response:** `500 Internal Server Error`
  ```json
  {
    "message": "An error occurred while processing your request."
  }
  ```
- **Example Usage:**
  ```json
  // Request
  {
    "question": "I have a fever, headache, and sore throat. What could it be?"
  }

  // Response
  {
    "response": "Based on your symptoms (fever, headache, and sore throat), 
                 you may have an upper respiratory infection. However, these 
                 symptoms could also indicate other conditions. Please consult 
                 a healthcare provider for an accurate diagnosis..."
  }
  ```
- **Note:** This endpoint connects to an AI-powered disease prediction system. The responses are generated by AI and should not be considered as a replacement for professional medical advice.

#### Profile Images

##### Get Profile Image
- **URL:** `GET /uploads/profile-images/:filename`
- **Auth:** No
- **Description:** Profile images are served as static files. The complete URL will be provided in the user object's `profileImage` field.
- **Example:**
  ```json
  {
    "user": {
      "profileImage": "/uploads/profile-images/user-123456-1234567890.jpg"
      // ... other user fields
    }
  }
  ```
- **Note:** To display a profile image, simply append the `profileImage` path to your base URL.
  Example: `http://localhost:5000/uploads/profile-images/user-123456-1234567890.jpg`

##### Upload Profile Image
Profile images can be uploaded through the user registration or profile update endpoints using `multipart/form-data`.
The file field should be named `profileImage`.

#### WebSocket Events

The server uses WebSocket for real-time features. Connect to:
```
ws://localhost:5000
```

Events:
- `appointment_update`: Appointment status changes
- `new_notification`: New notification received
- `call_status`: Video call status updates

Example WebSocket message format:
```json
{
  "type": "appointment_update",
  "data": {
    "appointmentId": "string",
    "status": "string",
    "timestamp": "date"
  }
}
```

## File Upload Specifications

- Profile Images:
  - Formats: jpeg, jpg, png
  - Max size: 5MB

- Medical Files:
  - Formats: pdf, doc, docx, jpg, jpeg, png
  - Max size: 10MB

- License Documents:
  - Formats: pdf, doc, docx, jpg, jpeg
  - Max size: 5MB

## Best Practices

1. Always include the Authorization header for authenticated endpoints
2. Handle file uploads using multipart/form-data
3. Implement proper error handling for all API calls
4. Use WebSocket connection for real-time features
5. Validate file types and sizes before upload

## Rate Limiting

The API implements rate limiting:
- 100 requests per IP per 15 minutes for public endpoints
- 1000 requests per IP per 15 minutes for authenticated endpoints

## Support

For API support or questions, please contact the development team or open an issue in the repository.
