import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def is_configured(value: str, placeholder: str) -> bool:
    return bool(value and value != placeholder)


def send_password_reset_email(recipient_email: str, reset_token: str) -> bool:
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    subject = "Reset your Ogelytics AI Workspace password"
    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5;">Ogelytics AI Workspace</h2>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <a href="{reset_link}"
         style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#6B7280;font-size:13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color:#6B7280;font-size:12px;">
        Or copy this link: {reset_link}
      </p>
    </body>
    </html>
    """
    body_text = f"Reset your password here: {reset_link}\n\nThis link expires in 1 hour."

    if not (
        is_configured(SENDGRID_API_KEY, "your_sendgrid_api_key_here")
        and is_configured(SENDGRID_FROM_EMAIL, "verified_sender@example.com")
    ):
        print("SendGrid is not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.")
        return False

    try:
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=recipient_email,
            subject=subject,
            html_content=body_html,
            plain_text_content=body_text,
        )
        SendGridAPIClient(SENDGRID_API_KEY).send(message)
        return True
    except Exception as e:
        print(f"SendGrid email send failed: {e}")
        return False
