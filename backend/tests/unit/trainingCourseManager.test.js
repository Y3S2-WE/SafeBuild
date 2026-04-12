jest.mock('../../models/Course', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

jest.mock('../../models/Lesson', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn()
}));

jest.mock('../../models/Enrollment', () => ({
  countDocuments: jest.fn(),
  deleteMany: jest.fn()
}));

const Course = require('../../models/Course');
const Lesson = require('../../models/Lesson');
const Enrollment = require('../../models/Enrollment');
const courseController = require('../../controllers/courseController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Training Course Manager unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllCourses should force workers to only see Published courses', async () => {
    const req = {
      query: {
        status: 'Draft',
        category: 'Safety'
      },
      user: {
        role: 'worker',
        id: 'worker-1'
      }
    };

    const res = createRes();
    const courses = [{ _id: 'course-1', status: 'Published' }];

    const sort = jest.fn().mockResolvedValue(courses);
    const populate = jest.fn().mockReturnValue({ sort });
    Course.find.mockReturnValue({ populate });

    await courseController.getAllCourses(req, res);

    expect(Course.find).toHaveBeenCalledWith({
      status: 'Published',
      category: 'Safety'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 1,
        data: courses
      })
    );
  });

  test('getAllCourses should scope trainers to their own courses', async () => {
    const req = {
      query: {
        status: 'Draft',
        level: 'Beginner'
      },
      user: {
        role: 'trainer',
        id: 'trainer-1'
      }
    };

    const res = createRes();

    const sort = jest.fn().mockResolvedValue([]);
    const populate = jest.fn().mockReturnValue({ sort });
    Course.find.mockReturnValue({ populate });

    await courseController.getAllCourses(req, res);

    expect(Course.find).toHaveBeenCalledWith({
      status: 'Draft',
      level: 'Beginner',
      createdBy: 'trainer-1'
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deleteCourse should reject non-owner trainer', async () => {
    const req = {
      params: { id: 'course-1' },
      user: { id: 'trainer-2' }
    };
    const res = createRes();

    Course.findById.mockResolvedValue({
      createdBy: { toString: () => 'trainer-1' }
    });

    await courseController.deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Lesson.deleteMany).not.toHaveBeenCalled();
    expect(Enrollment.deleteMany).not.toHaveBeenCalled();
  });

  test('deleteCourse should remove linked lessons and enrollments for owner', async () => {
    const req = {
      params: { id: 'course-9' },
      user: { id: 'trainer-1' }
    };
    const res = createRes();

    const deleteOne = jest.fn().mockResolvedValue();
    Course.findById.mockResolvedValue({
      createdBy: { toString: () => 'trainer-1' },
      deleteOne
    });

    Lesson.deleteMany.mockResolvedValue({});
    Enrollment.deleteMany.mockResolvedValue({});

    await courseController.deleteCourse(req, res);

    expect(Lesson.deleteMany).toHaveBeenCalledWith({ courseId: 'course-9' });
    expect(Enrollment.deleteMany).toHaveBeenCalledWith({ courseId: 'course-9' });
    expect(deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
