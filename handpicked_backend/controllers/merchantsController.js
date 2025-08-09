export const getAllMerchants = (req, res) => {
  res.json({ message: "Get all merchants" });
};

export const getMerchantById = (req, res) => {
  res.json({ message: `Get merchant ${req.params.id}` });
};

export const createMerchant = (req, res) => {
  res.json({ message: "Merchant created" });
};

export const updateMerchant = (req, res) => {
  res.json({ message: `Merchant ${req.params.id} updated` });
};

export const deleteMerchant = (req, res) => {
  res.json({ message: `Merchant ${req.params.id} deleted` });
};