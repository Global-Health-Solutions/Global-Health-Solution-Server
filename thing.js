// Register Admin
exports.registerAdmin = async (req, res) => {
  const { firstName, lastName, email, password, adminPassword } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const admin = new User({
      role: 'admin',
      firstName,
      lastName,
      email,
      password,
      adminPassword
    });

    const createdAdmin = await admin.save();
    res.status(201).json(createdAdmin);
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Authenticate Admin
exports.authAdmin = async (req, res) => {
  const { email, password, adminPassword } = req.body;

  try {
    const admin = await User.findOne({ email, role: 'admin' });

    if (admin && (await admin.matchPassword(password)) && (await admin.matchAdminPassword(adminPassword))) {
      res.json({
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password or admin password' });
    }
  } catch (error) {
    console.error("Error authenticating admin:", error);
    res.status(500).json({ message: 'Server error' });
  }
};
