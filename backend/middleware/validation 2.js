const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for phone number authentication
 */
const validatePhoneAuth = [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .trim(),
  handleValidationErrors
];

/**
 * Validation rules for phone number verification
 */
const validatePhoneVerification = [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .trim(),
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
  handleValidationErrors
];

/**
 * Validation rules for user profile update
 */
const validateProfileUpdate = [
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors
];

/**
 * Validation rules for custom token creation
 */
const validateCustomToken = [
  body('uid')
    .isString()
    .withMessage('User ID must be a string')
    .isLength({ min: 1 })
    .withMessage('User ID is required'),
  body('customClaims')
    .optional()
    .isObject()
    .withMessage('Custom claims must be an object'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validatePhoneAuth,
  validatePhoneVerification,
  validateProfileUpdate,
  validateCustomToken
};
