export const getAllTags = (req, res) => {
  res.json({ message: "Get all tags" });
};

export const getTagById = (req, res) => {
  res.json({ message: `Get tag ${req.params.id}` });
};

export const createTag = (req, res) => {
  res.json({ message: "Tag created" });
};

export const updateTag = (req, res) => {
  res.json({ message: `Tag ${req.params.id} updated` });
};

export const deleteTag = (req, res) => {
  res.json({ message: `Tag ${req.params.id} deleted` });
};