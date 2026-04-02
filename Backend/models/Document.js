import { Schema, model } from "mongoose";

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
  },
  {
    timestamps: true,
  },
);

documentSchema.pre("save", async function () {
  console.log("Saving document...", this._id);
});

export default model("Document", documentSchema);
