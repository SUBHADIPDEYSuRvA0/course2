const Course = require("../../models/courses");
const CourseDocument = require("../../models/coursedocuments");
const fs = require("fs");

class CourseController {
  async createCourse(req, res) {
    try {
      if (!req.user || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Access denied: Only teachers can create courses" });
      }

      const {
        title,
        description,
        features,
        price,
        discount,
        validated,
        notes,
        videos,
        assignments
      } = req.body;

      const parsedFeatures = Array.isArray(features) ? features : [features];
      const parsedNotes = Array.isArray(notes) ? notes : [notes];
      const parsedVideos = Array.isArray(videos) ? videos : [videos];
      const parsedAssignments = assignments ? JSON.parse(assignments) : [];

      const image = req.file ? req.file.path : null;

      const course = new Course({
        title,
        description,
        features: parsedFeatures,
        image,
        price,
        discount,
        validated,
      });

      const savedCourse = await course.save();

      const courseDocument = new CourseDocument({
        courseId: savedCourse._id,
        notes: parsedNotes,
        videos: parsedVideos,
        assignments: parsedAssignments,
      });

      await courseDocument.save();

      res.status(201).json({
        message: "Course and course documents created successfully",
        course: savedCourse,
        courseDocument,
      });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  }
}

module.exports = new CourseController();
