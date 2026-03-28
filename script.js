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

// Password Strength Checker

function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthMeter = document.getElementById('passwordStrength');
    const submitBtn = document.getElementById('signupSubmitBtn'); // added

    if (password.length === 0) {
        strengthMeter.className = 'password-strength';
        submitBtn.disabled = true;
        return;
    }

    let strength = 0;

    // ❗ Mandatory special character
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasSpecial) {
        strengthMeter.className = 'password-strength weak';
        submitBtn.disabled = true;
        return;
    }

    // Basic checks (your original logic improved)
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++; // bonus for longer passwords
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;

    // Repeated character check (aaa, 111)
    if (/(.)\1{2,}/.test(password)) {
        strength = Math.max(1, strength - 2);
    }

    // Repeated pattern check (abcabc, 123123)
    if (/(\w{3,})\1/.test(password)) {
        strength = Math.max(1, strength - 2);
    }

    // Sequential pattern check (12345, abcde)
    const sequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789"];
    for (let seq of sequences) {
        for (let i = 0; i < seq.length - 4; i++) {
            let part = seq.substring(i, i + 5);
            if (password.toLowerCase().includes(part)) {
                strength = Math.max(1, strength - 2);
            }
        }
    }

    // Normalize score between 1 and 4
    strength = Math.min(4, Math.max(1, strength));

    // UI + Enforcement
    if (strength === 1) {
        strengthMeter.className = 'password-strength weak';
        submitBtn.disabled = true;
    } else if (strength === 2 || strength === 3) {
        strengthMeter.className = 'password-strength medium';
        submitBtn.disabled = true;
    } else {
        strengthMeter.className = 'password-strength strong';
        submitBtn.disabled = false; // ONLY strong passwords allowed
    }
}
// Password Match Checker

function checkPasswordMatch() {

    const newPassword = document.getElementById('newPassword').value;

    const confirmPassword = document.getElementById('confirmPassword').value;

    const matchIndicator = document.getElementById('passwordMatch');

    const confirmInput = document.getElementById('confirmPassword');

    if (confirmPassword.length === 0) {

        matchIndicator.textContent = '';

        matchIndicator.className = 'password-match';

        confirmInput.classList.remove('valid', 'invalid');

        return;

    }
    if (newPassword === confirmPassword) {

        matchIndicator.textContent = 'Passwords match';

        matchIndicator.className = 'password-match match';

        confirmInput.classList.add('valid');

        confirmInput.classList.remove('invalid');
    }

    else {

        matchIndicator.textContent = 'X Passwords do not match';

        matchIndicator.className = 'password-match no-match';

        confirmInput.classList.add('invalid');

        confirmInput.classList.remove('valid');

    }

validateSignupForm();}

// Email Validation

function validateEmail() {

    const email = document.getElementById('email');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.value.length === 0) {
        email.classList.remove('valid', 'invalid');
        return;
    }
    if (emailRegex.test(email.value)) {

        email.classList.add('valid');

        email.classList.remove('invalid');
    }
    else {

        email.classList.add('invalid');

        email.classList.remove('valid');}

validateSignupForm();}
// Signup Form Validation

    function validateSignupForm(){

const fullName = document.getElementById('fullName').value.trim();

const username = document.getElementById('username').value.trim();

const email = document.getElementById('email').value.trim();

const newPassword = document.getElementById('newPassword').value;

const confirmPassword = document.getElementById('confirmPassword').value;

const submitBtn = document.getElementById('signupSubmitBtn');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

const hasUpperAndLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);

const hasNumber = /[0-9]/.test(newPassword);

const hasRepeatedChars = /(.)\1{2,}/.test(newPassword);

const hasRepeatedPattern = /(\w{3,})\1/.test(newPassword);

const sequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789"];
let hasSequence = false;

for (let seq of sequences) {
    for (let i = 0; i < seq.length - 4; i++) {
        let part = seq.substring(i, i + 5);
        if (newPassword.toLowerCase().includes(part)) {
            hasSequence = true;
        }
    }
}

const isValid = fullName && username && emailRegex.test(email) && newPassword.length >= 12 && hasSpecialChar && hasUpperAndLower && hasNumber && !hasRepeatedChars && !hasRepeatedPattern && !hasSequence && newPassword === confirmPassword;

submitBtn.disabled = !isValid;}

//OTP Input Setup

function setupOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
          const value = e.target.value;
          
          //Only allow numbers
          if (!/^\d$/.test(value)) {
            e.target.value = '';
            return;
          }

          e.target.classList.add('filled');

          //Move to next input
          if(value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        });

        input.addEventListener('keydown', (e) => {
            //handle backspace
            if(e.key === 'Backspace' && !input.value && index > 0) {
               otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData('text');
            const digits = paste.replace(/\D/g, '').slice(0,6);

            digits.split('').forEach((digit,i) => {
                if(otpInputs[i]) {
                    otpInputs[i].value = digit;
                    otpInputs[i].classList.add('filled');
                }
            });
        });
    });
}

// Show Loading Overlay

function showLoading(message = 'Loading...') {

    document.getElementById('loadingMessage').textContent = message;

    loadingOverlay.classList.remove('hidden');

}
// Hide Loading Overlay

function hideLoading() {

loadingOverlay.classList.add('hidden');}

// Show Success Animation

function showSuccessAnimation() {

    const successAnimation = document.getElementById('successAnimation');

    successAnimation.classList.remove('hidden');
    setTimeout(() => {

        const registerBtn = document.getElementById('registerBtn');

        registerBtn.classList.remove('hidden');

    }, 1000);

}
