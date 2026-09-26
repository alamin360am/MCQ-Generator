import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

const normalizeName = (value) => {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
};

export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({
    owner: req.user._id,
  })
    .sort({
      name: 1,
    })
    .lean();

  res.json({
    success: true,
    subjects,
  });
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const normalizedName = normalizeName(name);

  const existing = await Subject.findOne({
    owner: req.user._id,

    normalizedName,
  });

  if (existing) {
    throw new AppError(409, "This subject already exists");
  }

  const subject = await Subject.create({
    owner: req.user._id,

    name,

    normalizedName,
  });

  res.status(201).json({
    success: true,
    subject,
  });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  const normalizedName = normalizeName(req.body.name);

  const duplicate = await Subject.findOne({
    owner: req.user._id,

    normalizedName,

    _id: {
      $ne: subject._id,
    },
  });

  if (duplicate) {
    throw new AppError(409, "This subject already exists");
  }

  subject.name = req.body.name;

  subject.normalizedName = normalizedName;

  await subject.save();

  res.json({
    success: true,
    subject,
  });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  const [topicCount, questionCount] = await Promise.all([
    Topic.countDocuments({
      owner: req.user._id,

      subject: subject._id,
    }),

    Question.countDocuments({
      owner: req.user._id,

      subject: subject._id,
    }),
  ]);

  if (topicCount > 0 || questionCount > 0) {
    throw new AppError(
      409,
      "This subject is currently being used and cannot be deleted",
    );
  }

  await subject.deleteOne();

  res.json({
    success: true,

    message: "Subject deleted",
  });
});

export const getTopics = asyncHandler(async (req, res) => {
  const filter = {
    owner: req.user._id,
  };

  if (req.query.subjectId) {
    filter.subject = req.query.subjectId;
  }

  const topics = await Topic.find(filter)
    .populate("subject", "name")
    .sort({
      name: 1,
    })
    .lean();

  res.json({
    success: true,
    topics,
  });
});

export const createTopic = asyncHandler(async (req, res) => {
  const { subjectId, name } = req.body;

  const subject = await Subject.findOne({
    _id: subjectId,

    owner: req.user._id,
  });

  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  const normalizedName = normalizeName(name);

  const existing = await Topic.findOne({
    owner: req.user._id,

    subject: subject._id,

    normalizedName,
  });

  if (existing) {
    throw new AppError(
      409,
      "This topic already exists under the selected subject",
    );
  }

  const topic = await Topic.create({
    owner: req.user._id,

    subject: subject._id,

    name,

    normalizedName,
  });

  await topic.populate("subject", "name");

  res.status(201).json({
    success: true,
    topic,
  });
});

export const updateTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!topic) {
    throw new AppError(404, "Topic not found");
  }

  const subject = await Subject.findOne({
    _id: req.body.subjectId,

    owner: req.user._id,
  });

  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  const normalizedName = normalizeName(req.body.name);

  const duplicate = await Topic.findOne({
    owner: req.user._id,

    subject: subject._id,

    normalizedName,

    _id: {
      $ne: topic._id,
    },
  });

  if (duplicate) {
    throw new AppError(
      409,
      "This topic already exists under the selected subject",
    );
  }

  topic.subject = subject._id;

  topic.name = req.body.name;

  topic.normalizedName = normalizedName;

  await topic.save();

  await topic.populate("subject", "name");

  res.json({
    success: true,
    topic,
  });
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!topic) {
    throw new AppError(404, "Topic not found");
  }

  const questionCount = await Question.countDocuments({
    owner: req.user._id,

    topic: topic._id,
  });

  if (questionCount > 0) {
    throw new AppError(
      409,
      "This topic is currently being used and cannot be deleted",
    );
  }

  await topic.deleteOne();

  res.json({
    success: true,

    message: "Topic deleted",
  });
});
