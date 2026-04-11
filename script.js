// Clean Authentication Script No GSAP Dependencies

// Global variables for storing user data and OTP

let userData = {};

let currentOTP = '';

let otpTimer = null;

let otpTimeLeft = 120; // 2 minutes in seconds
let resendAttempts = 0;
const MAX_RESEND = 3;

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

    const savedUser = localStorage.getItem('userData');

    if (savedUser) {
        userData = JSON.parse(savedUser);
    }

    // Check login state
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
        showWelcomePage(userData.fullName);
    } else {
        showSignupForm();
    }

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

// Form Navigation Functions with CSS Animations

function showSignupForm() {

    hideAllContainers();

    signupContainer.classList.remove('hidden');

    resetForms();
    resendAttempts = 0;


    // CSS fade-in animation

    signupContainer.style.opacity = '0';

    signupContainer.style.transform = 'translateY(20px)';

    setTimeout(() => {

        signupContainer.style.transition = 'all 0.3s ease';

        signupContainer.style.opacity = '1';

        signupContainer.style.transform = 'translateY(0)';

    }, 10);

}

function showSignupOTPForm() {

    hideAllContainers();

    signupOtpContainer.classList.remove('hidden');

    startOTPTimer('otpTimer');
    clearOTPInputs();

    // CSS fade-in animation

    signupOtpContainer.style.opacity = '0';

    signupOtpContainer.style.transform = 'translateY(20px)';

    setTimeout(() => {

        signupOtpContainer.style.transition = 'all 0.3s ease';

        signupOtpContainer.style.opacity = '1';

        signupOtpContainer.style.transform = 'translateY(0)';

    }, 10);

}

function showLoginForm() {

    hideAllContainers();

    loginContainer.classList.remove('hidden');

    resetForms();
    resendAttempts = 0;

    // CSS fade-in animation

    loginContainer.style.opacity = '0';

    loginContainer.style.transform = 'translateY(20px)';

    setTimeout(() => {

        loginContainer.style.transition = 'all 0.3s ease';

        loginContainer.style.opacity = '1';

        loginContainer.style.transform = 'translateY(0)';

    }, 10);

}

function showLoginOTPForm() {

    hideAllContainers();

    loginOtpContainer.classList.remove('hidden');

    startOTPTimer('loginOtpTimer');

    clearOTPInputs();

    // CSS fade-in animation

    loginOtpContainer.style.opacity = '0';

    loginOtpContainer.style.transform = 'translateY(20px)';

    setTimeout(() => {

        loginOtpContainer.style.transition = 'all 0.3s ease';

        loginOtpContainer.style.opacity = '1';

        loginOtpContainer.style.transform = 'translateY(0)';

    }, 10);

}

function showWelcomePage(name) {

    hideAllContainers();

    welcomeContainer.classList.remove('hidden');

    const welcomeTitle = document.getElementById('welcomeTitle');

    welcomeTitle.textContent = `Welcome, ${name}!`;
    // CSS typewriter animation

    welcomeTitle.style.width = '0';

    welcomeTitle.style.animation = 'none';

    setTimeout(() => {

        welcomeTitle.style.animation = 'typewriter 2s steps(20) forwards';
    }, 100);
    // CSS fade-in animation for container

    welcomeContainer.style.opacity = '0';

    welcomeContainer.style.transform = 'translateY(20px)';

    setTimeout(() => {
        welcomeContainer.style.transition = 'all 0.3s ease';

        welcomeContainer.style.opacity = '1';

        welcomeContainer.style.transform = 'translateY(0)';

    }, 10);
}

function hideAllContainers() {
    [signupContainer, signupOtpContainer, loginContainer, loginOtpContainer, welcomeContainer].forEach(container => {
        container.classList.add('hidden');
    });
}

// Reset Forms

function resetForms() {

    document.querySelectorAll('form').forEach(form => form.reset());

    document.querySelectorAll('.otp-input').forEach(input => {

        input.value = '';

        input.classList.remove('filled');

    });
    document.getElementById('passwordStrength').className = 'password-strength';

    document.getElementById('passwordMatch').textContent = '';

    document.getElementById('successAnimation').classList.add('hidden');

    document.getElementById('registerBtn').classList.add('hidden');

    clearInterval(otpTimer);

}

// Clear OTP Inputs

function clearOTPInputs() {

    document.querySelectorAll('.otp-input').forEach(input => { 
        input.value = ''; 
        input.classList.remove('filled'); 
    });
}

//OTP Timer Functions
function startOTPTimer(timerId) {
    otpTimeLeft = 120;
    const timerElement = document.getElementById(timerId);
    const resendBtn = timerId === 'otpTimer' ?
        document.getElementById('resendOtp') :
        document.getElementById('resendLoginOtp');
    resendBtn.disabled = true;
    otpTimer = setInterval(() => {
        const minutes = Math.floor(otpTimeLeft / 60); // how many minute you want timer
        const seconds = otpTimeLeft % 60; // how many seconds you want timer
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if(otpTimeLeft <= 0) {
            clearInterval(otpTimer);
            timerElement.textContent = 'Expired';
            timerElement.parentElement.classList.add('expired');
            resendBtn.disabled = false;
            currentOTP = '';
        }

        otpTimeLeft--;
    }, 1000);
}

// API Call Functions

async function sendOTPEmail(email, type = 'signup') {

    try {

        const response = await fetch(`${API_BASE_URL}/send-otp`, {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({ email, type })

        });
        const data = await response.json();

        if (response.ok) {

            currentOTP = data.otp;

            console.log('OTP sent to email:', email);

            console.log('Generated OTP:', currentOTP); // For testing

            return { success: true, otp: data.otp };
        } else {

            throw new Error(data.message || 'Failed to send OTP');

        }

    } catch (error) {

        console.error('Error sending OTP:', error);

        return { success: false, error: error.message };

    }

}

//Signup submit handler
async function handleSignupSubmit(e) {
    e.preventDefault();

    //store user data
    userData = {
        fullName: document.getElementById('fullName').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('newPassword').value
    };

    showLoading('Sending OTP to your email...');

    //Send OTP
    const result = await sendOTPEmail(userData.email, 'signup');

    hideLoading();

    if (result.success) {
        document.getElementById('otpMessage').textContent = 
            `Enter the 6-digit code sent to ${userData.email}`;
        showSignupOTPForm();
    }
    else {
        alert('Failed to send OTP: ' + result.error);
    }
}

//Signup OTP verification handler
async function handleSignupOTPVerification(e) {
    e.preventDefault();

    const otpInputs = document.querySelectorAll('#signupOtpContainer .otp-input');
    const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');

    if (enteredOTP.length !== 6) {
        alert('Please enter a complete 6-digit OTP');
        return;
    }

    showLoading('Verifying OTP...');

    const result = await verifyOTPWithServer(userData.email, enteredOTP, 'signup');

    hideLoading();

    if (result.success) {
        clearInterval(otpTimer);
        showSuccessAnimation();
        document.getElementById('verifyOtpBtn').disabled = true;
        document.getElementById('verifyOtpBtn').textContent = 'Verified';
    } else {
        alert(result.message);
        clearOTPInputs();
    }
}

//registration handler
async function handleRegistration(e) {
    e.preventDefault();

    showLoading('Completing registration...');

    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    const result = await response.json();
    hideLoading();

    if (result.success) {
        alert('Registration successful!');
        showLoginForm();
    } else {
        alert(result.message);
    }
}

// Login Submit Handler

async function handleLoginSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        // Verify login data
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!result.success) {
            hideLoading();
            alert('Invalid username or password');
            return;
        }

        //Store user (safe data only)
        userData = result.user;

        localStorage.setItem('currentUser', userData.username);

        //Send OTP
        showLoading('Sending OTP...');

        const otpResult = await sendOTPEmail(userData.email, 'login');

        hideLoading();

        if (otpResult.success) {
            showLoginOTPForm();
        } else {
            alert('Failed to send OTP: ' + otpResult.error);
        }

    } catch (error) {
        hideLoading();
        console.error(error);
        alert('Login failed. Please try again.');
    }
}

// Login OTP Verification Handler

async function handleLoginOTPVerification(e) {

e.preventDefault();

const otpInputs = document.querySelectorAll('#loginOtpContainer .otp-input');

const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');

if (enteredOTP.length !==6) {

alert('Please enter a complete 6-digit OTP');

return;

}

showLoading('Verifying login...');

const result = await verifyOTPWithServer(userData.email, enteredOTP, 'login');

hideLoading();

if (result.success) { 
    clearInterval(otpTimer); 
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', userData.username);
    showWelcomePage(userData.fullName); 
} else {
    alert(result.message);
    clearOTPInputs();
}

}

async function verifyOTPWithServer(email, otp, type) {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp, type })
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('OTP verification error:', error);
        return { success: false, message: 'Server error' };
    }
}

// Resend OTP Handler

async function resendOTP(type) {

    
    const email = userData.email;

    if (!email) {
        alert('Email not found. Please restart the process.');
        return;
    }
    
    if (resendAttempts <= MAX_RESEND) {
    

        showLoading('Resending OTP...');

        try {
            const response = await fetch(`${API_BASE_URL}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            body: JSON.stringify({ email, type }) 
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {

            resendAttempts++; 
            currentOTP = result.otp;
            const timerId = type === 'signup' ? 'otpTimer' : 'loginOtpTimer';
            startOTPTimer(timerId);
            clearOTPInputs();

            alert(` OTP resent (${resendAttempts}/3 attempt)`);

            } else {
            alert(result.message);
            }

            } catch (error) {
            hideLoading();
            alert('Error resending OTP');
            console.error(error);
        }
    }
    else{
                disableResendButton(type);
    }
}

function disableResendButton(type) {

    const btn = type === 'signup'
        ? document.getElementById('resendOtp')
        : document.getElementById('resendLoginOtp');

    btn.disabled = true;
    btn.textContent = "Try again after 15 min";

    setTimeout(() => {
        resendAttempts = 0;
        btn.disabled = false;
        btn.textContent = "Resend Code";
    }, 15 * 60 * 1000);
}

//logout handler
function handleLogout() {
    userData = {};
    currentOTP = '';
    clearInterval(otpTimer);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    showLoginForm();
}

//utility functions

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

//error handling
window.addEventListener('error', function(e) {
    console.error('Javascript Error:', e.error);
    hideLoading();
});

// API Error Fallback (if backend is not running)

window.addEventListener('unhandledrejection', function(e) {

    console.error('Network Error:', e.reason);

    hideLoading();

    if (e.reason.message && e.reason.message.includes('fetch')) {

        // Fallback to console logging if backend is not available
        console.warn('Backend not available, using console OTP method');

        // Override sendOTPEmail for local testing

        window.sendOTPEmailFallback = function(email, type) {

            return new Promise((resolve) => {

                setTimeout(() => {

                    const otp = generateOTP();
console.log(`
╔══════════════════════════════════════╗
║              OTP VERIFICATION         ║
╠══════════════════════════════════════╣
║ Email: ${email.padEnd(25)} ║
║ Type:  ${type.padEnd(25)} ║
║ OTP:   ${otp.padEnd(25)} ║
╚══════════════════════════════════════╝
                    `);
                    resolve({ success: true, otp});
                }, 1000);
            });
        };
        
        //replace the API call
        if (typeof sendOTPEmail !== 'undefined') {
            window.originalSendOTPEmail = sendOTPEmail;
            window.sendOTPEmail = sendOTPEmailFallback;
        }
    }
});
