import Document from "../models/Document.js";
import User from "../models/User.js";

// @desc    Create a new document
// @route   POST /api/docs
// @access  Private (Needs JWT)
export const createDocument = async (req, res) => {
  try {
    console.log("User creating doc:", req.user._id); // CHECK THIS IN TERMINAL

    const newDoc = await Document.create({
      title: "Untitled Document",
      content: {},
      owner: req.user._id,
    });

    res.status(201).json(newDoc);
  } catch (error) {
    console.error("DETAILED ERROR:", error); // THIS WILL TELL YOU THE REAL PROBLEM
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get a single document by ID
// @route   GET /api/docs/:id
// @access  Private/Public (Depending on your choice)
export const getDocument = async (req, res) => {
  try {
    // .populate('owner', 'username email') lets you see the owner's name instead of just an ID
    const document = await Document.findById(req.params.id).populate(
      "owner",
      "username email",
    );

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all documents for the logged-in user
// @route   GET /api/docs
// @access  Private
// controllers/documentController.js
export const getUserDocuments = async (req, res) => {
  try {
    // Find documents where the user is the OWNER OR a COLLABORATOR
    const documents = await Document.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .sort("-updatedAt")
      .populate("owner", "username email"); // Optional: populate owner info for the UI

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updatedDocumentTitle = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const updatedDoc = await Document.findByIdAndUpdate(
      id,
      { title },
      { new: true },
    );

    res.status(200).json(updatedDoc);
  } catch (error) {
    res.status(500).json({ message: `Server error updating title` });
  }
};

export const shareDocument = async (req, res) => {
  const { email } = req.body; // The person you want to invite
  const { id: docId } = req.params;

  try {
    // 1. Find the user by the email provided in the Share Modal
    const userToShareWith = await User.findOne({ email });
    if (!userToShareWith) {
      return res
        .status(404)
        .json({ message: "No user found with that email." });
    }

    // 2. Find the document
    const document = await Document.findById(docId);
    if (!document)
      return res.status(404).json({ message: "Document not found" });

    // 3. Security Check: Only the owner can share
    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Permission denied: Only owners can share." });
    }

    // 4. Add to collaborators array if not already there
    if (!document.collaborators.includes(userToShareWith._id)) {
      document.collaborators.push(userToShareWith._id);
      await document.save();
    }

    res.status(200).json({
      message: `Successfully shared with ${userToShareWith.username}`,
      user: {
        id: userToShareWith._id,
        username: userToShareWith.username,
        avatarColor: userToShareWith.avatarColor,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during sharing" });
  }
};
