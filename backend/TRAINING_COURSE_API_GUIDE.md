# Training Course Management System - Postman Testing Guide

This guide covers all API endpoints for the Training Course Management System including Course Management, Lesson Management, and Worker Enrollment features.

## Base URL
```
http://localhost:5000/api
```

## Authentication Setup

All endpoints require authentication. You must include the JWT token in the Authorization header:

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

### Get Your Token First

1. **Register a Trainer**
   - **Method:** POST
   - **URL:** `{{BASE_URL}}/users/register`
   - **Body (JSON):**
   ```json
   {
     "name": "John Trainer",
     "email": "trainer@example.com",
     "password": "trainer123",
     "role": "trainer",
     "department": "Training"
   }
   ```

2. **Register a Worker**
   - **Method:** POST
   - **URL:** `{{BASE_URL}}/users/register`
   - **Body (JSON):**
   ```json
   {
     "name": "Jane Worker",
     "email": "worker@example.com",
     "password": "worker123",
     "role": "worker",
     "department": "Operations"
   }
   ```

3. **Login to Get Token**
   - **Method:** POST
   - **URL:** `{{BASE_URL}}/users/login`
   - **Body (JSON):**
   ```json
   {
     "email": "trainer@example.com",
     "password": "trainer123"
   }
   ```
   - **Save the token** from the response and add it to Authorization header for subsequent requests

---

## 📚 COURSE MANAGEMENT (Trainer Only)

### 1. Create Course
Create a new training course (Trainer only).

- **Method:** POST
- **URL:** `{{BASE_URL}}/courses`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  Content-Type: application/json
  ```
- **Body (JSON):**
```json
{
  "title": "Personal Protective Equipment Training",
  "category": "PPE",
  "description": "Comprehensive training on the proper use and maintenance of personal protective equipment in construction sites.",
  "level": "Beginner",
  "duration": 4,
  "status": "Draft"
}
```

**Available Categories:**
- PPE
- Electrical Safety
- Working at Heights
- Fire Safety
- First Aid
- Hazardous Materials
- Machine Safety
- Confined Spaces
- Other

**Available Levels:**
- Beginner
- Intermediate
- Advanced

**Available Status:**
- Draft (not visible to workers)
- Published (visible to workers)

### 2. Get All Courses
Retrieve all courses with optional filters.

- **Method:** GET
- **URL:** `{{BASE_URL}}/courses`
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

**Query Parameters (optional):**
```
?category=PPE
?level=Beginner
?status=Published
?search=safety
```

**Examples:**
- Get all published courses: `{{BASE_URL}}/courses?status=Published`
- Get PPE courses: `{{BASE_URL}}/courses?category=PPE`
- Get beginner level courses: `{{BASE_URL}}/courses?level=Beginner`
- Search courses: `{{BASE_URL}}/courses?search=equipment`

**Note:** Workers can only see Published courses. Trainers see only their own courses.

### 3. Get Single Course
Get detailed information about a specific course including all lessons.

- **Method:** GET
- **URL:** `{{BASE_URL}}/courses/:courseId`
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

**Example:**
```
{{BASE_URL}}/courses/64abc123def456789
```

### 4. Update Course
Update course details (Trainer only, must own the course).

- **Method:** PUT
- **URL:** `{{BASE_URL}}/courses/:courseId`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  Content-Type: application/json
  ```
- **Body (JSON):**
```json
{
  "title": "Advanced PPE Training",
  "category": "PPE",
  "description": "Updated description with more details",
  "level": "Intermediate",
  "duration": 6,
  "status": "Published"
}
```

**Note:** Changing status from "Draft" to "Published" makes the course visible to workers.

### 5. Delete Course
Delete a course and all associated lessons and enrollments (Trainer only).

- **Method:** DELETE
- **URL:** `{{BASE_URL}}/courses/:courseId`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  ```

**Warning:** This action is irreversible and will delete all lessons, enrollments, and progress data.

### 6. Get Course Statistics
Get enrollment statistics for a course (Trainer only).

- **Method:** GET
- **URL:** `{{BASE_URL}}/courses/:courseId/stats`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  ```

**Response includes:**
- Total enrolled workers
- Number of workers who haven't started
- Number of workers currently learning
- Number of workers who finished
- Total lessons count

---

## 📖 LESSON MANAGEMENT (Trainer Only)

### 1. Create Lesson
Add a new lesson to a course.

- **Method:** POST
- **URL:** `{{BASE_URL}}/lessons`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  Content-Type: application/json
  ```
- **Body (JSON):**
```json
{
  "courseId": "64abc123def456789",
  "title": "Introduction to PPE",
  "description": "Learn about different types of personal protective equipment",
  "orderIndex": 1,
  "duration": 30,
  "pages": []
}
```

### 2. Get All Lessons for a Course
Retrieve all lessons belonging to a specific course.

- **Method:** GET
- **URL:** `{{BASE_URL}}/lessons/course/:courseId`
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

**Example:**
```
{{BASE_URL}}/lessons/course/64abc123def456789
```

### 3. Get Single Lesson
Get detailed information about a specific lesson including all pages.

- **Method:** GET
- **URL:** `{{BASE_URL}}/lessons/:lessonId`
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```

### 4. Update Lesson
Update lesson details.

- **Method:** PUT
- **URL:** `{{BASE_URL}}/lessons/:lessonId`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  Content-Type: application/json
  ```
- **Body (JSON):**
```json
{
  "title": "Updated Lesson Title",
  "description": "Updated description",
  "orderIndex": 1,
  "duration": 45
}
```

### 5. Delete Lesson
Delete a lesson and all associated progress data.

- **Method:** DELETE
- **URL:** `{{BASE_URL}}/lessons/:lessonId`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  ```

---

## 📄 PAGE MANAGEMENT (Within Lessons - Trainer Only)

### 1. Add Page to Lesson
Add a new page with content to a lesson.

- **Method:** POST
- **URL:** `{{BASE_URL}}/lessons/:lessonId/pages`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  Content-Type: application/json
  ```

**A. Text Content Page:**
```json
{
  "title": "Understanding Hard Hats",
  "contentType": "text",
  "textContent": "<h2>Types of Hard Hats</h2><p>Hard hats are classified into different types based on the protection they provide...</p><ul><li>Type I: Top impact protection</li><li>Type II: Top and lateral impact protection</li></ul>"
}
```

**B. Video Content Page:**
```json
{
  "title": "PPE Safety Demonstration",
  "contentType": "video",
  "videoUrl": "https://www.youtube.com/watch?v=example123",
  "videoTitle": "Proper PPE Usage Video"
}
```

**C. Mixed Content Page:**
```json
{
  "title": "PPE Inspection Guide",
  "contentType": "mixed",
  "textContent": "<h3>Before You Start</h3><p>Watch the video below and follow the checklist...</p>",
  "videoUrl": "https://www.youtube.com/watch?v=inspection123",
  "videoTitle": "PPE Inspection Video Tutorial"
}
```

**Content Types:**
- `text` - Only text content (supports HTML from rich text editor)
- `video` - Only video link (YouTube or other video URLs)
- `mixed` - Both text and video content

### 2. Update Page in Lesson
Update an existing page's content.

- **Method:** PUT
- **URL:** `{{BASE_URL}}/lessons/:lessonId/pages/:pageId`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  Content-Type: application/json
  ```
- **Body (JSON):**
```json
{
  "title": "Updated Page Title",
  "contentType": "text",
  "textContent": "<h2>Updated Content</h2><p>New information here...</p>"
}
```

### 3. Delete Page from Lesson
Remove a page from a lesson.

- **Method:** DELETE
- **URL:** `{{BASE_URL}}/lessons/:lessonId/pages/:pageId`
- **Headers:**
  ```
  Authorization: Bearer <trainer_token>
  ```

**Note:** Page numbers will be automatically reordered after deletion.

---

## 👷 WORKER ENROLLMENT & PROGRESS

### 1. Enroll in Course
Worker enrolls in a published course.

- **Method:** POST
- **URL:** `{{BASE_URL}}/enrollments`
- **Headers:**
  ```
  Authorization: Bearer <worker_token>
  Content-Type: application/json
  ```
- **Body (JSON):**
```json
{
  "courseId": "64abc123def456789"
}
```

**Note:** 
- Only Published courses can be enrolled
- Cannot enroll in the same course twice
- Automatically increments course's enrolled count

### 2. Get My Enrollments
Get all courses the worker is enrolled in.

- **Method:** GET
- **URL:** `{{BASE_URL}}/enrollments/my-courses`
- **Headers:**
  ```
  Authorization: Bearer <worker_token>
  ```

**Response includes:**
- Course details
- Enrollment status (Not Started, Learning, Finished)
- Progress percentage
- Last accessed lesson
- Completion date (if finished)

### 3. Get Enrollment Details for a Course
Get detailed enrollment information including all lessons and progress.

- **Method:** GET
- **URL:** `{{BASE_URL}}/enrollments/course/:courseId`
- **Headers:**
  ```
  Authorization: Bearer <worker_token>
  ```

**Response includes:**
- Enrollment details
- All lessons in the course
- Progress data for each lesson
- Completed lessons list

### 4. Update Learning Progress
Track progress as worker completes pages and lessons.

- **Method:** POST
- **URL:** `{{BASE_URL}}/enrollments/progress`
- **Headers:**
  ```
  Authorization: Bearer <worker_token>
  Content-Type: application/json
  ```

**A. Mark Page as Completed:**
```json
{
  "courseId": "64abc123def456789",
  "lessonId": "64def456abc789123",
  "pageId": "64ghi789jkl012345",
  "isLessonCompleted": false
}
```

**B. Mark Lesson as Completed:**
```json
{
  "courseId": "64abc123def456789",
  "lessonId": "64def456abc789123",
  "pageId": "64ghi789jkl012345",
  "isLessonCompleted": true
}
```

**Auto-Features:**
- Progress is automatically saved
- Enrollment status changes from "Not Started" to "Learning" on first access
- Overall progress percentage is calculated automatically
- Course status changes to "Finished" when all lessons completed
- Last accessed lesson is saved for "Continue Learning" feature

### 5. Continue Learning
Get information to resume from last accessed lesson.

- **Method:** GET
- **URL:** `{{BASE_URL}}/enrollments/:enrollmentId/continue`
- **Headers:**
  ```
  Authorization: Bearer <worker_token>
  ```

**Response includes:**
- Enrollment details
- Next lesson to continue from
- Last accessed page number

**Use Case:**
- Shows where the worker left off
- Enables "Continue Learning" button in UI
- Returns first lesson if never started

### 6. Get Courses by Status
Filter enrolled courses by their completion status.

- **Method:** GET
- **URL:** `{{BASE_URL}}/enrollments/status/:status`
- **Headers:**
  ```
  Authorization: Bearer <worker_token>
  ```

**Available Status Values:**
- `Not Started` - Enrolled but not yet accessed
- `Learning` - Currently in progress
- `Finished` - Completed all lessons

**Examples:**
```
{{BASE_URL}}/enrollments/status/Not Started
{{BASE_URL}}/enrollments/status/Learning
{{BASE_URL}}/enrollments/status/Finished
```

---

## 🧪 COMPLETE TESTING WORKFLOW

### Scenario 1: Trainer Creates and Publishes a Course

1. **Login as Trainer** → Get token
2. **Create Course** with status "Draft"
3. **Create Lesson 1** for the course
4. **Add Text Page** to Lesson 1
5. **Add Video Page** to Lesson 1
6. **Create Lesson 2** for the course
7. **Add Mixed Content Page** to Lesson 2
8. **Update Course** status to "Published"
9. **Get Course Statistics** to verify setup

### Scenario 2: Worker Enrolls and Completes Course

1. **Login as Worker** → Get token
2. **Get All Courses** (should see only Published courses)
3. **Get Course Details** to view lessons
4. **Enroll in Course**
5. **Get My Enrollments** (should show "Not Started")
6. **Get Enrollment Details** to see all lessons
7. **Update Progress** for Lesson 1, Page 1
8. **Get My Enrollments** (should now show "Learning")
9. **Continue Learning** to get next lesson info
10. **Update Progress** for Lesson 1, Page 2 and mark lesson complete
11. **Update Progress** for all pages in Lesson 2 and mark complete
12. **Get My Enrollments** (should show "Finished" with 100% progress)
13. **Get Courses by Status "Finished"** to see completed courses

### Scenario 3: Trainer Manages Course Content

1. **Login as Trainer**
2. **Get All Courses** (my courses)
3. **Get Course Statistics** to see enrollment data
4. **Update Lesson** order or content
5. **Update Page** content in a lesson
6. **Add New Page** to existing lesson
7. **Delete Page** from lesson
8. **Create New Lesson** for the course
9. **Delete Lesson** if needed

---

## 🔍 TESTING EDGE CASES

### Authorization Tests

1. **Worker tries to create course** → Should fail (403)
2. **Worker tries to update/delete course** → Should fail (403)
3. **Worker tries to view Draft course** → Should fail (403)
4. **Trainer tries to modify another trainer's course** → Should fail (403)
5. **Trainer tries to enroll in course** → Should fail (403)

### Validation Tests

1. **Create course with invalid category** → Should fail (400)
2. **Create course with invalid level** → Should fail (400)
3. **Create course with missing required fields** → Should fail (400)
4. **Enroll in already enrolled course** → Should fail (400)
5. **Update progress without enrollment** → Should fail (404)

### Business Logic Tests

1. **Enroll in Draft course** → Should fail (403)
2. **Delete course with enrollments** → Should succeed and delete all related data
3. **Complete all lessons** → Progress should auto-update to 100%, status to "Finished"
4. **Access first lesson** → Status should change from "Not Started" to "Learning"
5. **Get course stats** → Should show correct counts

---

## 📊 EXPECTED RESPONSE EXAMPLES

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Course List Response
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64abc123def456789",
      "title": "PPE Training",
      "category": "PPE",
      "level": "Beginner",
      "duration": 4,
      "status": "Published",
      "enrolledCount": 5,
      "totalLessons": 3,
      "createdBy": {
        "_id": "64xyz789abc123456",
        "name": "John Trainer",
        "email": "trainer@example.com"
      },
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-22T15:30:00.000Z"
    }
  ]
}
```

### Enrollment Progress Response
```json
{
  "success": true,
  "data": {
    "enrollment": {
      "_id": "64enr123abc456789",
      "userId": "64usr456def789012",
      "courseId": "64abc123def456789",
      "status": "Learning",
      "progress": 50,
      "lastAccessedLesson": "64les789ghi012345",
      "completedLessons": ["64les789ghi012345"],
      "enrollmentDate": "2026-02-21T09:00:00.000Z"
    },
    "progress": {
      "_id": "64prg345hij678901",
      "userId": "64usr456def789012",
      "lessonId": "64les789ghi012345",
      "completedPages": ["64pg1", "64pg2"],
      "isCompleted": true,
      "completedAt": "2026-02-22T14:25:00.000Z"
    }
  }
}
```

---

## 💡 TIPS FOR TESTING

1. **Use Postman Environment Variables:**
   - Set `BASE_URL` = `http://localhost:5000/api`
   - Set `TRAINER_TOKEN` after trainer login
   - Set `WORKER_TOKEN` after worker login
   - Set `COURSE_ID`, `LESSON_ID`, etc. to reuse in requests

2. **Save Response Values:**
   - Use Postman's "Tests" tab to automatically save IDs
   ```javascript
   pm.environment.set("COURSE_ID", pm.response.json().data._id);
   ```

3. **Test in Order:**
   - Create courses before lessons
   - Create lessons before pages
   - Publish courses before worker enrollment
   - Enroll before updating progress

4. **Check Database:**
   - Verify enrolled counts match actual enrollments
   - Check progress percentages are accurate
   - Confirm status changes occur correctly

5. **Use Different User Roles:**
   - Always test with both trainer and worker tokens
   - Verify authorization is working correctly

---

## 📝 NOTES

- All dates are in ISO 8601 format
- All IDs are MongoDB ObjectIds (24 character hex strings)
- Text content can include HTML from rich text editors
- Video URLs should be valid YouTube or video platform links
- Duration for courses is in hours, for lessons is in minutes
- Progress percentage is automatically calculated (0-100)
- Page numbers are automatically managed by the system

---

## 🐛 TROUBLESHOOTING

**Problem:** Getting 401 Unauthorized
- **Solution:** Check if token is valid and included in Authorization header

**Problem:** Getting 403 Forbidden
- **Solution:** Check if user role has permission for this action

**Problem:** Course not visible to worker
- **Solution:** Ensure course status is "Published", not "Draft"

**Problem:** Cannot enroll in course
- **Solution:** Check if already enrolled or if course is not Published

**Problem:** Progress not updating
- **Solution:** Ensure enrolled in course first and using correct IDs

**Problem:** Continue Learning returns null
- **Solution:** Check if course has lessons and enrollment exists

---

## 🎯 QUICK REFERENCE

| Feature | Trainer | Worker |
|---------|---------|--------|
| Create Course | ✅ | ❌ |
| View Draft Courses | ✅ (own) | ❌ |
| View Published Courses | ✅ | ✅ |
| Update Course | ✅ (own) | ❌ |
| Delete Course | ✅ (own) | ❌ |
| Create/Edit Lessons | ✅ | ❌ |
| Create/Edit Pages | ✅ | ❌ |
| View Course Statistics | ✅ (own) | ❌ |
| Enroll in Course | ❌ | ✅ |
| Track Progress | ❌ | ✅ |
| View My Enrollments | ❌ | ✅ |
| Continue Learning | ❌ | ✅ |

---

**End of Testing Guide**

For additional help or to report issues, please contact the development team.
