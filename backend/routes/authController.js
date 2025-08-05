const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
  console.log('Register user function called');
  res.status(501).json({ message: 'Register user functionality not implemented yet.' });
};

const loginUser = async (req, res) => {
  console.log('Login user function called');
  res.status(501).json({ message: 'Login user functionality not implemented yet.' });
};

const googleAuth = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        password: 'google-auth-password',
        profilePicture: picture,
        isGoogleUser: true,
      });
    } else {
      if (!user.isGoogleUser) {
        user.isGoogleUser = true;
        user.profilePicture = user.profilePicture || picture;
        await user.save();
      }
    }

    const jwtToken = generateToken(user._id);
    res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        isGoogleUser: user.isGoogleUser,
      },
      token: jwtToken,
    });

  } catch (error) {
    console.error('Google token verification failed:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
};