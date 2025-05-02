const Course = require("../../models/courses");
const fs = require("fs");
const path = require("path");

class CourseController {
  // Create a new course
  async createCourse(req, res) {
    try {
      const {
        title,
        description,
        features,
        price,
        discount,
        validated,
      
      } = req.body;

      const image = req.file ? req.file.path : null;

      const course = new Course({
        title,
        description,
        features: Array.isArray(features) ? features : [features],
        image,
        price,
        discount,
        validated,
        
      });

      await course.save();
     res.json({ submit: true }); // or any meaningful value

    } catch (error) {
      console.error("Error creating course:", error);
     
    }
  }

  // Update a course by ID
  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        features,
        price,
        discount,
        cgst,
        sgst,
        igst,
        validated,
    
      } = req.body;

      const course = await Course.findById(id);
      if (!course) return res.status(404).send("Course not found");

      // Image update
      const image = req.file ? req.file.path : null;
      if (image) {
        if (course.image && fs.existsSync(course.image)) {
          fs.unlinkSync(course.image);
        }
        course.image = image;
      }

      // Update fields
      course.title = title;
      course.description = description;
      course.price = price;
      course.discount = discount;
      course.cgst = cgst;
      course.sgst = sgst;
      course.igst = igst;
      course.validated = validated;

      // Features
      course.features = Array.isArray(features) ? features : [features];

      await course.save();
      res.redirect("/admin/courses");
    } catch (error) {
      console.error("Error updating course:", error);
      res.redirect("/admin/courses");
    }
  }

  // Delete a course by ID
  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) return res.redirect("/admin/courses");

      if (course.image && fs.existsSync(course.image)) {
        fs.unlinkSync(course.image);
      }

      await Course.findByIdAndDelete(id);
      res.redirect("/admin/courses");
    } catch (error) {
      console.error("Error deleting course:", error);
      res.redirect("/admin/courses");
    }
  }
}

module.exports = new CourseController();
