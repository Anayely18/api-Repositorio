import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

    }

    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendVerificationCode(email, code, name) {
        const mailOptions = {
            from: `"Repositorio UNAMBA" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Código de Verificación - Recuperación de Contraseña',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: #4F46E5;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            background-color: white;
                            padding: 30px;
                            border-radius: 0 0 8px 8px;
                        }
                        .code-box {
                            background-color: #f3f4f6;
                            border: 2px dashed #4F46E5;
                            padding: 20px;
                            text-align: center;
                            margin: 20px 0;
                            border-radius: 8px;
                        }
                        .code {
                            font-size: 32px;
                            font-weight: bold;
                            color: #4F46E5;
                            letter-spacing: 5px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                            font-size: 12px;
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 10px;
                            margin: 15px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Recuperación de Contraseña</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${name}</strong>,</p>
                            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Repositorio Institucional de la UNAMBA.</p>
                            
                            <p>Tu código de verificación es:</p>
                            
                            <div class="code-box">
                                <div class="code">${code}</div>
                            </div>
                            
                            <div class="warning">
                                <strong>Importante:</strong>
                                <ul>
                                    <li>Este código expirará en <strong>10 minutos</strong></li>
                                    <li>No compartas este código con nadie</li>
                                    <li>Si no solicitaste este cambio, ignora este correo</li>
                                </ul>
                            </div>
                            
                            <p>Ingresa este código en la página de recuperación de contraseña para continuar.</p>
                            
                            <p>Saludos,<br><strong>Equipo del Repositorio UNAMBA</strong></p>
                        </div>
                        <div class="footer">
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                            <p>&copy; ${new Date().getFullYear()} UNAMBA - Todos los derechos reservados</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email enviado:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error al enviar email:', error);
            throw new Error('No se pudo enviar el correo de verificación');
        }
    }

    async sendPasswordChangeConfirmation(email, name) {
        const mailOptions = {
            from: `"Repositorio UNAMBA" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Contraseña Actualizada Exitosamente',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: #10b981;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            background-color: white;
                            padding: 30px;
                            border-radius: 0 0 8px 8px;
                        }
                        .success-icon {
                            text-align: center;
                            font-size: 48px;
                            margin: 20px 0;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✓ Contraseña Actualizada</h1>
                        </div>
                        <div class="content">
                            <div class="success-icon">✅</div>
                            
                            <p>Hola <strong>${name}</strong>,</p>
                            
                            <p>Tu contraseña ha sido actualizada exitosamente.</p>
                            
                            <p>Si no realizaste este cambio, por favor contacta inmediatamente con el administrador del sistema.</p>
                            
                            <p>Saludos,<br><strong>Equipo del Repositorio UNAMBA</strong></p>
                        </div>
                        <div class="footer">
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                            <p>&copy; ${new Date().getFullYear()} UNAMBA - Todos los derechos reservados</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error al enviar email de confirmación:', error);
            return false;
        }
    }
}

export default new EmailService();