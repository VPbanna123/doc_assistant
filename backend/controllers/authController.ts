import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user';
import dotenv from 'dotenv';

dotenv.config();

// Helper function for consistent error responses
const handleError = (res: Response, status: number, message: string) => {
  return res.status(status).json({ success: false, message });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      handleError(res, 400, 'Please provide all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      handleError(res, 400, 'Please provide a valid email address');
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      handleError(res, 400, 'User with this email already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate token for immediate login after registration
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // Send response with token and user data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    handleError(res, 500, 'Server error during registration');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      handleError(res, 400, 'Please provide both email and password');
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      handleError(res, 400, 'Invalid credentials');
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      handleError(res, 400, 'Invalid credentials');
      return;
    }

    // Generate token with extended expiration
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // Send response with token and user data
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    handleError(res, 500, 'Server error during login');
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const userId = req.user?.id;
    
    if (!userId) {
      handleError(res, 401, 'Not authenticated');
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      handleError(res, 404, 'User not found');
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    handleError(res, 500, 'Server error retrieving user data');
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      handleError(res, 401, 'Not authenticated');
      return;
    }

    const { name, email, phone, bio } = req.body;
    const updateData: { name?: string; email?: string; phone?: string; bio?: string } = {};
    
    if (name) updateData.name = name;
if (email) updateData.email = email;
if (phone) updateData.phone = phone;
if (bio) updateData.bio = bio;

    // Check if email already exists if trying to change email
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        handleError(res, 400, 'Email already in use');
        return;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      handleError(res, 404, 'User not found');
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    handleError(res, 500, 'Server error updating profile');
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      handleError(res, 401, 'Not authenticated');
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      handleError(res, 400, 'Please provide both current and new password');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      handleError(res, 404, 'User not found');
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      handleError(res, 400, 'Current password is incorrect');
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    handleError(res, 500, 'Server error changing password');
  }
};
// Save processing history
export const saveHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      handleError(res, 401, 'Not authenticated');
      return;
    }

    const { filename } = req.body;

    if (!filename) {
      handleError(res, 400, 'Filename is required');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      handleError(res, 404, 'User not found');
      return;
    }

    user.history.push({ filename, createdAt: new Date() });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'History saved successfully'
    });
  } catch (error) {
    console.error('Save history error:', error);
    handleError(res, 500, 'Server error saving history');
  }
};
