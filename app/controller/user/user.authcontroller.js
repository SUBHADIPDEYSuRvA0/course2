const User = require('../../models/user');
const Otp = require('../../models/otp');
const crypto = require('crypto');
const sendOtpToEmail = require('../../utils/sendotp'); // Brevo logic
const bcrypt = require('bcryptjs');
const refferal = require("../../models/refaralbouns")
const jwt = require("jsonwebtoken")

class UserController {
  // ✅ Step 1: Send OTP to Email
  sendOtp = async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) return res.status(400).json({ message: 'Email is required' });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

      // Remove any old OTPs
      await Otp.deleteMany({ email });

      // Save new OTP
      await Otp.create({ email, otp });

      // Send OTP via Brevo email service
      await sendOtpToEmail(email, otp);

      res.status(200).json({ message: 'OTP sent to email' });
    } catch (error) {
      console.error('Send OTP Error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // ✅ Generate unique referral code
  generateUniqueReferralCode = async () => {
    let code;
    let exists = true;

    while (exists) {
      code = crypto.randomBytes(6).toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')  // Only alphanumeric characters
        .substring(0, 10)              // Limit to 10 characters
        .toUpperCase();                // Uppercase code

      const existingUser = await User.findOne({ myReferralCode: code });
      if (!existingUser) exists = false;
    }

    return code;
  };

  // ✅ Step 2: Verify OTP & Complete Signup
  signup = async (req, res) => {
    try {
      const { name, email, password, otp, referralCode,phone,role } = req.body;
  
      if (!name || !email || !password || !otp || !phone) {
        
        res.json("All fields are required")

       
      }
  
      const existingOtp = await Otp.findOne({ email, otp });
      if (!existingOtp) {
        req.json('Invalid or expired OTP')
        
      }
  
      const userExists = await User.findOne({ email });
      if (userExists) {
        req.json('Email already registered Please login')
        
      }
  
      const myReferralCode = await this.generateUniqueReferralCode();
      let referredByUser = null;
      let referredByCode = "";
  
      if (referralCode) {
        referredByUser = await User.findOne({ myReferralCode: referralCode });
        if (!referredByUser) {
          res.json('Invalid referral code')
          
        }
        referredByCode = referralCode;
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        myReferralCode,
        role,
        refferby: referredByCode,
      });
    
      await newUser.save();
  
      const setrefferalbonusbonus = await refferal.findOne({});
      if (referredByUser) {
        referredByUser.mybonus = (referredByUser.mybonus || 0) + setrefferalbonusbonus.referalbonus;
        await referredByUser.save();
      }
  
      await Otp.deleteMany({ email });
  
      res.json('Signup successful  please login') // Set success message in session
  
     res.json({ success: true, message: 'Signup successful' });
    } catch (error) {
     
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
  login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        res.json('Email and password are required')
        // return res.status(400).json({ message: req.session.message });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        res.json('User not found')
        // return res.status(404).json({ message: req.session.message });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.json('Invalid password')
        // return res.status(401).json({ message: req.session.message });
      }
  
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role || 'user',
      };
  
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
  
      res.json('Login successful')



      
  
      res.status(200).json({
        message: req.session.message,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          myReferralCode: user.myReferralCode,
          referredBy: user.refferby,
        }
      });
    } catch (error) {
      // console.error('Login Error:', error);
      res.json('Server error')
      res.status(500).json({ message: req.session.message });
    }
  };
  
  logout = (req, res) => {
    res.clearCookie('token');
    res.json('logout successful please login')
    

    res.status(200).json({ message: 'Logged out successfully please login' });
  };
  
}

module.exports = new UserController();
