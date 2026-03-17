// Clean Authentication Script No GSAP Dependencies

// Global variables for storing user data and OTP

let userData = {};

let currentOTP = '';

let otpTimer = null;

let otpTimeLeft = 120; // 2 minutes in seconds

// API Base URL Change this to your backend URL

const API_BASE_URL = 'http://localhost:3000/api';
// DOM Elements

const signupContainer = document.getElementById('signupContainer');

const signupOtpContainer = document.getElementById('signupOtpContainer');

const loginContainer = document.getElementById('loginContainer');

const loginOtpContainer = document.getElementById('loginOtpContainer');

const welcomeContainer = document.getElementById('welcomeContainer');

const loadingOverlay = document.getElementById('loadingOverlay');
// Initialize the application

document.addEventListener('DOMContentLoaded', function() {

initializeEventListeners();

setupOTPInputs();

showSignupForm();

});
// Event Listeners Setup

function initializeEventListeners() {

// Signup form submission

document.getElementById('signupForm').addEventListener('submit', handleSignupSubmit);

// Signup OTP verification

document.getElementById('signupOtpForm').addEventListener('submit', handleSignupOTPVerification);

// Registration completion

document.getElementById('registerBtn').addEventListener('click', handleRegistration);

// Login form submission

document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);

// Login OTP verification

    document.getElementById('loginOtpForm').addEventListener('submit', handleLoginOTPVerification);

    // Navigation

    document.getElementById('showSignup').addEventListener('click', (e) => {

        e.preventDefault();

        showSignupForm();

    });

    document.getElementById('showLogin').addEventListener('click', (e) => {

        e.preventDefault();

        showLoginForm();

    });

    document.getElementById('backToSignup').addEventListener('click', (e) => {

        e.preventDefault();

        showSignupForm();

    });

    document.getElementById('backToLogin').addEventListener('click', (e) => {

        e.preventDefault();

        showLoginForm();

    });

    //Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

// Resend OTP buttons

document.getElementById('resendOtp').addEventListener('click', () => resendOTP('signup'));

document.getElementById('resendLoginOtp').addEventListener('click', () => resendOTP('login'));

// Form validation

setupFormValidation();

}
// Form Validation Setup
function setupFormValidation() {
const signupInputs= document.querySelectorAll('#signupForm input[required]');

const newPassword = document.getElementById('newPassword');

const confirmPassword = document.getElementById('confirmPassword');

const submitBtn = document.getElementById('signupSubmitBtn');

// Real-time validation

signupInputs.forEach(input => {

 input.addEventListener('input', validateSignupForm);
});
// Password strength checker

newPassword.addEventListener('input', checkPasswordStrength);

// Password match checker

confirmPassword.addEventListener('input', checkPasswordMatch);

// Email validation

document.getElementById('email').addEventListener('input', validateEmail);

}