import 'dotenv/config';
import { Resend } from 'resend';

const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

let resendClient: Resend | null = null;

function getResendClient(): Resend {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        throw new Error('RESEND_API_KEY is not configured');
    }
    if (!resendClient) {
        resendClient = new Resend(resendApiKey);
    }
    return resendClient;
}

export async function sendAdminInvitationEmail(params: {
    to: string;
    invitationCode: string;
}): Promise<void> {
    const { to, invitationCode } = params;
    const registerUrl = `${appUrl}/admin/auth`;

    const { error } = await getResendClient().emails.send({
        from: emailFrom,
        to,
        subject: 'You are invited to MediQueue as an admin',
        html: `
            <p>You have been invited to join <strong>MediQueue</strong> as an admin.</p>
            <p>Your invitation code:</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${invitationCode}</p>
            <p>Go to <a href="${registerUrl}">${registerUrl}</a>, enter this code, then register using this email:</p>
            <p><strong>${to}</strong></p>
            <p>If you did not expect this email, you can ignore it.</p>
        `,
    });

    if (error) {
        throw new Error(error.message || 'Failed to send invitation email');
    }
}
