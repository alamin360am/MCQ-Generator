import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";

import AppError from "../utils/AppError.js";

export const cleanQuestionTags = (tags = []) => {
  return [
    ...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ];
};

export const validateQuestionTaxonomy = async ({
  owner,
  subjectId,
  topicId,
}) => {
  let subject = null;
  let topic = null;

  if (subjectId) {
    subject = await Subject.findOne({
      _id: subjectId,
      owner,
    });

    if (!subject) {
      throw new AppError(400, "Selected subject is invalid");
    }
  }

  if (topicId) {
    topic = await Topic.findOne({
      _id: topicId,
      owner,
    });

    if (!topic) {
      throw new AppError(400, "Selected topic is invalid");
    }

    if (!subject) {
      subject = await Subject.findOne({
        _id: topic.subject,
        owner,
      });
    }

    if (!subject || topic.subject.toString() !== subject._id.toString()) {
      throw new AppError(
        400,
        "Selected topic does not belong to the selected subject",
      );
    }
  }

  return {
    subject,
    topic,
  };
};
