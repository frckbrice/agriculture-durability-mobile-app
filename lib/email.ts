
import { Platform } from 'react-native';
import RNMail from 'react-native-mail';
interface EmailOptions {
    to: string[];
    subject: string;
    body: string;
    attachments?: Array<{
        // filename: string;
        // content: string;
        encoding: string;
        path?: string;
        uri?: string;
        type?: string;
        mimeType?: string;
        name?: string;
    }>;
}

const attachment = {
    uri: Platform.OS === 'android' ? `file://` : ``,
    type: 'application/pdf',
    name: 'transmission_declaration.pdf',
};




export const sendEmail = (options: EmailOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        RNMail.mail(
            {
                ...options,
                isHTML: false, // Set to true if body is HTML
            },
            (error) => {
                if (error) {
                    console.error('Error sending email:', error);
                    reject(new Error('Failed to send email'));
                } else {
                    resolve();
                }
            }
        );
    });
};