import mongoose, { Schema, model } from "mongoose";

const versionSchema = new mongoose.Schema({
  content: {
    type: Object,
    required: true,
  },
  name: {
    type: String,
    default: `Autosave`,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const documentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Untitled Document",
      trim: true,
    },
    content: {
      type: Object,
      default: {},
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    versions: [versionSchema],
  },
  {
    timestamps: true,
  },
);

documentSchema.pre("save", async function () {
  console.log("Saving document...", this._id);
});

export default model("Document", documentSchema);
