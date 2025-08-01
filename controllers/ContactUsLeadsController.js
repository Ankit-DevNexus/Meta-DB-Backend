import nodemailer from 'nodemailer';
import { getContactUsModel } from '../models/ContactusModel.js';


const contactUsModel = await getContactUsModel();
export const getAllContactSubmissions = async (req, res) => {
  try {
    const submissions = await contactUsModel.find().sort({ created_at: -1 });
    res.status(200).json({
         message: "Fetch all contact submissions successfully",
         TotoalLeads: submissions.length,
         submissions
    });
  } catch (error) {
    console.error("Error fetching contact form data:", error);
    res.status(500).json({ error: "Failed to fetch contact submissions" });
  }
};


export const contactus = async (req, res) => {
    try {
        const { name, lastname, email, phoneCountryCode, phoneNumber, services, message } = req.body;

        // Step 1: Save contact form data to DB
        const newContact = new contactUsModel({
            name,
            lastname,
            email,
            phoneCountryCode,
            phoneNumber,
            services,
            message
        });

        await newContact.save();

        console.log("Client email:", email);
        console.log("Admin email:", process.env.ADMIN_MAIL.trim());

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: true,
            auth: {
                user: process.env.USER_MAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        // === Email to Client ===
        // const clientHtmlContent = loadHtmlTemplate(content.template, {
        //     'Client Name': name +" "+ lastname,
        //     'Email': email,
        //     'Phone Number': phoneNumber,
        //     'Service': services,
        //     'Message': message
        // });

        const clientMailOptions = {
            from: `"DevNexus Solutions" <${process.env.USER_MAIL}>`,
            to: email.trim(), // Client's email
            subject: "Thank you",
            text: `New contact form submission:
                \nName: ${name}
                \nEmail: ${email}
                \nPhone:  ${phoneCountryCode} ${phoneNumber}
                \nService: ${services}
                \nMessage: ${message}`        
            };

        // === Email to Owner  ===
        const ownerMailOptions = {
            from: `"Website Contact Form" <${process.env.USER_MAIL}>`,
            to: process.env.ADMIN_MAIL.trim(), // Owne r's email
            subject: `New Contact Request - ${services}`,
            text: `New contact form submission:
                \nName: ${name}
                \nEmail: ${email}
                \nPhone: ${phoneCountryCode} ${phoneNumber}
                \nService: ${services}
                \nMessage: ${message}`
        };

        await transporter.sendMail(clientMailOptions);
        await transporter.sendMail(ownerMailOptions);

        res.status(200).json({ message: 'Form submitted and emails sent successfully.' });
    } catch (error) {
        console.error('Mail sending error:', error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
};



