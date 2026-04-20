import Document from "../models/Document.js";
import User from "../models/User.js";

export const createDocument = async (req, res) => {
  try {
    console.log("User creating doc:", req.user._id);

    const newDoc = await Document.create({
      title: "Untitled Document",
      content: {},
      owner: req.user._id,
    });

    res.status(201).json(newDoc);
  } catch (error) {
    console.error("DETAILED ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
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

export const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .sort("-updatedAt")
      .populate("owner", "username email");

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
  const { email } = req.body;
  const { id: docId } = req.params;

  try {
    const userToShareWith = await User.findOne({ email });
    if (!userToShareWith) {
      return res
        .status(404)
        .json({ message: "No user found with that email." });
    }

    const document = await Document.findById(docId);
    if (!document)
      return res.status(404).json({ message: "Document not found" });

    if (document.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Permission denied: Only owners can share." });
    }

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

export const saveVersion = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const newVersion = {
      content: doc.content,
      name: name || `Version ${doc.versions.length + 1}`,
      createdAt: new Date(),
    };

    if (doc.versions.length >= 15) {
      doc.versions.shift();
    }

    doc.versions.push(newVersion);
    await doc.save();

    res.status(201).json(newVersion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id).select("versions");

    if (!doc) {
      return res.status(404).json({ message: `Document not found` });
    }

    const history = Array.isArray(doc.versions)
      ? [...doc.versions].reverse()
      : [];

    res.json(history);
  } catch (error) {
    console.error(`BACKEND ERROR: `, error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDoc = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: `Document not found` });
    }

    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: `You don't have permission to delete this documents`,
      });
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: `Document deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: `Server error during deletion` });
  }
};
