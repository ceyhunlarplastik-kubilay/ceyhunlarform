import nodemailer from "nodemailer";

export interface SendMailProps {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendMail({ to, subject, html, text }: SendMailProps) {
    const user = process.env.GOOGLE_EMAIL;
    const pass = process.env.GOOGLE_APP_PASSWORD;

    if (!user || !pass) {
        throw new Error("Missing GOOGLE_EMAIL or GOOGLE_APP_PASSWORD env variables");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });

    const info = await transporter.sendMail({
        from: user,
        to,
        subject,
        html,
        text: text ?? "",
    });

    console.log("Mail sent:", info.messageId);
    return info;
}
