import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
  { 
    title: {
      type: String,
      required: false,
    },
    company: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: false,
      },
    description: {
      type: String,
      required: false,
    },
    fullDescription: {
      type: String,
      required: false,
    },
    publicationDate: {
      type: Date,
      required: false,
    },
    thumbnail: {
      type: String,
      required: false,
    },
    salary: {
      type: String,
      required: false,
    },
    technologies: {
      type: [String],
      required: false,
    },
    url:{
        type: String,
        required: false,
    },
    site:{
      type: String,
      required: false,
    },
    verifyHuman:{
      type: Boolean,
      required: false,
    },
    junior:{
      type: Boolean,
      required: false,
    },
    english:{
      type: Boolean,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);


const Job = mongoose.model("Job", querySchema);

export default Job;
