export enum Step {
  email = "email",
  otp = "otp",
  newPassword = "newPassword",
}

export interface EmailFormData {
  email: string;
}

export interface OtpFormData {
  otp: string;
}

export interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}
