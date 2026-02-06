import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true, // Use pooled connections for better stability
    maxConnections: 3,
    maxMessages: 100,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Helper function to send email with retry logic for transient errors
 */
const sendMailWithRetry = async (mailOptions, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            lastError = error;
            // Retry on transient errors like 421 or connection issues
            const isTransient = error.responseCode === 421 ||
                error.code === 'ECONNECTION' ||
                error.code === 'ETIMEDOUT' ||
                error.message.includes('Temporary System Problem');

            if (isTransient && i < maxRetries - 1) {
                console.warn(`⚠️  Email sending failed (attempt ${i + 1}/${maxRetries}). Retrying in 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

/**
 * Send an email notification to a student
 * @param {string} to - Recipient email
 * @param {string} studentName - Name of the student
 * @param {string} jobTitle - Title of the opportunity
 * @param {string} status - accepted or rejected
 * @param {string} message - Personalized message from the company
 */
export const sendApplicationStatusEmail = async (to, studentName, jobTitle, status, message) => {
    // Skip if placeholders are present
    if (process.env.EMAIL_USER.includes('yourgmail') || !process.env.EMAIL_PASS) {
        console.log('Skipping actual email send: Placeholders detected in .env');
        console.log(`Email would have been sent to: ${to} | Status: ${status}`);
        return;
    }

    const isAccepted = status === 'accepted';
    const subject = isAccepted ? `Congratulations! You've been accepted for ${jobTitle}` : `Update on your application for ${jobTitle}`;

    const mailOptions = {
        from: `"Evalora" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #83c8c8ff;">Evalora</h1>
                </div>
                <h2>Hello ${studentName},</h2>
                <p>We have an update regarding your application for the <strong>${jobTitle}</strong> position.</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: ${isAccepted ? '#e8f5e9' : '#ffebee'}; border-left: 5px solid ${isAccepted ? '#4caf50' : '#f44336'};">
                    <p style="font-size: 1.1rem; color: ${isAccepted ? '#2e7d32' : '#c62828'}; margin: 0;">
                        Status: <strong>${status.toUpperCase()}</strong>
                    </p>
                </div>

                ${message ? `
                    <div style="margin: 20px 0; padding: 15px; border: 1px dashed #83c8c8ff; border-radius: 5px;">
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 5px;">Message from the employer:</p>
                        <p style="font-style: italic; color: #333;">"${message}"</p>
                    </div>
                ` : ''}

                <p>You can view more details on your dashboard.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:5500/opport.html" style="background-color: #83c8c8ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                </div>

                <p style="margin-top: 40px; font-size: 0.8rem; color: #888; text-align: center;">
                    © 2025 Evalora. All Rights Reserved.
                </p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log(`Success: Application status email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const FAKE_DOMAINS = ['test.com', 'example.com', 'fake.com', 'temp.com', 'mailinator.com', 'testmail.com'];

/**
 * Send verification code email for password reset
 * @param {string} to - Recipient email address
 * @param {string} code - 4-digit verification code
 */
export const sendVerificationCode = async (to, code) => {
    // [DEBUG] Always log code to terminal for easier testing
    console.log(`[DEBUG] Password Reset Code for ${to}: ${code}`);

    // Extract email domain
    const emailDomain = to.split('@')[1];

    // If it's a known fake domain, assume it's for dev/testing and intercept
    if (FAKE_DOMAINS.includes(emailDomain)) {
        console.log('🔌 [DEV] Interception for fake domain:', to);
        console.log('🔑 Verification Code:', code);
        return;
    }

    // Skip if placeholders are present
    if (process.env.EMAIL_USER?.includes('yourgmail') || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email not configured. Verification code:', code);
        console.log('💡 Set EMAIL_USER and EMAIL_PASS in .env to send actual emails');
        return;
    }

    const mailOptions = {
        from: `"Evalora" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Password Reset Verification Code - Evalora',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #006D77, #004F52); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
                    </div>
                    <div style="padding: 40px 30px; text-align: center;">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            You requested to reset your password for your Evalora account.
                            Use the verification code below to proceed:
                        </p>
                        <div style="background-color: #E0EEEE; border: 2px dashed #006D77; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block;">
                            <div style="font-size: 36px; font-weight: bold; color: #006D77; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${code}
                            </div>
                        </div>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Enter this code on the verification page to continue with your password reset.
                        </p>
                        <div style="background-color: #FFF7CC; border-left: 4px solid #c9a236; padding: 15px; margin: 20px 0; text-align: left; font-size: 14px; color: #6b4e00;">
                            <strong>⚠️ Security Notice:</strong><br>
                            • This code will expire in <strong>5 minutes</strong><br>
                            • If you didn't request this, please ignore this email<br>
                            • Never share this code with anyone
                        </div>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p style="margin: 5px 0;">© 2025 Evalora. All Rights Reserved.</p>
                        <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </div>
        `,
        text: `
Password Reset Verification Code

You requested to reset your password for your Evalora account.

Your verification code is: ${code}

This code will expire in 5 minutes.

If you didn't request this, please ignore this email.

© 2025 Evalora. All Rights Reserved.
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log(`✉️  Verification email sent to ${to}`);
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send registration verification email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {string} code - 4-digit verification code
 */
export const sendRegistrationVerificationEmail = async (to, name, code) => {
    // [DEBUG] Always log code to terminal for easier testing
    console.log(`[DEBUG] Verification Code for ${to}: ${code}`);

    // Validate email domain
    const emailDomain = to.split('@')[1];
    if (!emailDomain) {
        throw new Error('Invalid email format');
    }

    // If it's a known fake domain, assume it's for dev/testing and intercept
    if (FAKE_DOMAINS.includes(emailDomain)) {
        console.log('🔌 [DEV] Interception for fake domain:', to);
        console.log('🔑 Verification Code:', code);
        return;
    }

    // Skip if placeholders are present
    if (process.env.EMAIL_USER?.includes('yourgmail') || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email not configured. Verification code:', code);
        console.log('💡 Set EMAIL_USER and EMAIL_PASS in .env to send actual emails');
        return;
    }

    const mailOptions = {
        from: `"Evalora" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Welcome to Evalora - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #006D77, #83c8c8ff); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Evalora!</h1>
                    </div>
                    <div style="padding: 40px 30px; text-align: center;">
                        <p style="color: #333; font-size: 18px; line-height: 1.6; margin: 20px 0;">
                            Hi <strong>${name}</strong>,
                        </p>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Thank you for registering! To complete your registration and start exploring opportunities, please verify your email address.
                        </p>
                        <p style="color: #666; font-size: 14px; margin: 10px 0;">
                            Your verification code is:
                        </p>
                        <div style="background-color: #E0EEEE; border: 2px dashed #006D77; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block;">
                            <div style="font-size: 36px; font-weight: bold; color: #006D77; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${code}
                            </div>
                        </div>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Enter this code on the verification page to activate your account.
                        </p>
                        <div style="background-color: #FFF7CC; border-left: 4px solid #c9a236; padding: 15px; margin: 20px 0; text-align: left; font-size: 14px; color: #6b4e00;">
                            <strong>⚠️ Important:</strong><br>
                            • This code will expire in <strong>10 minutes</strong><br>
                            • If you didn't create this account, please ignore this email<br>
                            • Never share this code with anyone
                        </div>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p style="margin: 5px 0;">© 2025 Evalora. All Rights Reserved.</p>
                        <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </div>
        `,
        text: `
Welcome to Evalora!

Hi ${name},

Thank you for registering! To complete your registration, please verify your email address.

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't create this account, please ignore this email.

© 2025 Evalora. All Rights Reserved.
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log(`✉️  Registration verification email sent to ${to}`);
    } catch (error) {
        console.error('❌ Error sending registration verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send project verification email to a company
 * @param {string} companyEmail - Company's email address
 * @param {string} companyName - Company's name
 * @param {string} studentName - Student's name who submitted the project
 * @param {string} projectTitle - Title of the project
 * @param {string} projectId - Project ID for verification link
 * @param {string} verificationToken - Unique token for verification
 */
export const sendCompanyProjectVerificationEmail = async (
    companyEmail,
    companyName,
    studentName,
    projectTitle,
    projectId,
    verificationToken
) => {
    // Skip if placeholders are present
    if (process.env.EMAIL_USER?.includes('yourgmail') || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email not configured. Company project verification:');
        console.log(`   Company: ${companyName} (${companyEmail})`);
        console.log(`   Student: ${studentName}`);
        console.log(`   Project: ${projectTitle}`);
        console.log(`   Token: ${verificationToken}`);
        console.log('💡 Set EMAIL_USER and EMAIL_PASS in .env to send actual emails');
        return;
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/verify-project.html?token=${verificationToken}&projectId=${projectId}`;

    const mailOptions = {
        from: `"Evalora" <${process.env.EMAIL_USER}>`,
        to: companyEmail,
        subject: `Project Verification Request - ${projectTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #006D77, #83c8c8ff); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🔍 Project Verification Request</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="color: #333; font-size: 18px; line-height: 1.6; margin: 20px 0;">
                            Hello <strong>${companyName}</strong>,
                        </p>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            A student has submitted a project claiming it was completed for your company. We need your verification before proceeding.
                        </p>
                        
                        <div style="background-color: #f0f9f9; border-left: 4px solid #006D77; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #006D77;">Project Details</h3>
                            <p style="margin: 8px 0; color: #333;"><strong>Project Title:</strong> ${projectTitle}</p>
                            <p style="margin: 8px 0; color: #333;"><strong>Submitted By:</strong> ${studentName}</p>
                        </div>

                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Please verify if this project was indeed completed for your company:
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #006D77; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                Review & Verify Project
                            </a>
                        </div>

                        <div style="background-color: #FFF7CC; border-left: 4px solid #c9a236; padding: 15px; margin: 20px 0; text-align: left; font-size: 14px; color: #6b4e00;">
                            <strong>⚠️ Important:</strong><br>
                            • If this project is not associated with your company, please reject it<br>
                            • You can provide feedback and optionally score the project<br>
                            • Your response helps maintain the integrity of student portfolios
                        </div>

                        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                            If you cannot click the button above, copy and paste this link into your browser:<br>
                            <a href="${verificationUrl}" style="color: #006D77; word-break: break-all;">${verificationUrl}</a>
                        </p>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p style="margin: 5px 0;">© 2025 Evalora. All Rights Reserved.</p>
                        <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </div>
        `,
        text: `
Project Verification Request

Hello ${companyName},

A student has submitted a project claiming it was completed for your company.

Project Details:
- Project Title: ${projectTitle}
- Submitted By: ${studentName}

Please verify this project by visiting:
${verificationUrl}

If this project is not associated with your company, please reject it.

© 2025 Evalora. All Rights Reserved.
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log(`✉️  Company project verification email sent to ${companyEmail}`);
    } catch (error) {
        console.error('❌ Error sending company project verification email:', error);
        throw new Error('Failed to send company project verification email');
    }
};

/**
 * Send a test notification email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 */
export const sendTestNotificationEmail = async (to, name) => {
    const mailOptions = {
        from: `"Evalora" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Evalora Test Notification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h1 style="color: #006D77; text-align: center;">Evalora</h1>
                <h2>Hello ${name},</h2>
                <p>This is a <strong>test notification</strong> sent from your account settings.</p>
                <p>If you received this, your email notification channel is working correctly!</p>
                <div style="margin-top: 30px; padding: 15px; background-color: #f0f9f9; border-radius: 6px;">
                    <p style="margin: 0; color: #006D77;">
                        You can manage your notification preferences anytime from the Notifications page in your settings.
                    </p>
                </div>
                <p style="margin-top: 40px; font-size: 0.8rem; color: #888; text-align: center;">
                    © 2025 Evalora. All Rights Reserved.
                </p>
            </div>
        `
    };

    try {
        await sendMailWithRetry(mailOptions);
        console.log(`✉️  Test notification email sent to ${to}`);
    } catch (error) {
        console.error('❌ Error sending test notification email:', error);
        throw error;
    }
};
