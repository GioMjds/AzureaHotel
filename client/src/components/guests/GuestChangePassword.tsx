/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Lock, Save } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../services/Auth';
import { PasswordFields } from '../../types/GuestProfileClient';

const GuestChangePassword = () => {
    const navigate = useNavigate();
    const [passwordData, setPasswordData] = useState<PasswordFields>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    const [validations, setValidations] = useState({
        minLength: false,
        hasSpecial: false,
        hasNumber: false,
        hasUppercase: false,
        matching: false
    });

    const passwordMutation = useMutation({
        mutationFn: () => changePassword(
            passwordData.oldPassword,
            passwordData.newPassword,
            passwordData.confirmPassword
        ),
        onSuccess: () => {
            setPasswordSuccess("Password changed successfully!");
            setPasswordData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordError(null);
            navigate('/guest/profile');
        },
        onError: (error: any) => {
            setPasswordError(error.response?.data?.error || "Failed to change password. Please try again.");
            setPasswordSuccess(null);
        }
    });

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));

        setPasswordError(null);
        setPasswordSuccess(null);

        if (name === 'newPassword' || name === 'confirmPassword') {
            const newValidations = {
                minLength: passwordData.newPassword.length >= 8 || (name === 'newPassword' && value.length >= 8),
                hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) || (name === 'newPassword' && /[!@#$%^&*(),.?":{}|<>]/.test(value)),
                hasNumber: /\d/.test(passwordData.newPassword) || (name === 'newPassword' && /\d/.test(value)),
                hasUppercase: /[A-Z]/.test(passwordData.newPassword) || (name === 'newPassword' && /[A-Z]/.test(value)),
                matching: passwordData.newPassword === passwordData.confirmPassword ||
                    (name === 'newPassword' && value === passwordData.confirmPassword) ||
                    (name === 'confirmPassword' && passwordData.newPassword === value)
            };
            setValidations(newValidations);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("Passwords don't match");
            return;
        }

        passwordMutation.mutate();
    };

    return (
        <div className="max-w-md mx-auto my-12 bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl">
            <div className="md:flex">
                <div className="w-full p-8">
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            onClick={() => navigate('/guest/profile')}
                            className="text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Create a strong password to protect your account
                    </p>

                    {passwordError && (
                        <div className="mb-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 animate-fadeIn">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <span>{passwordError}</span>
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="mb-6 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 animate-fadeIn">
                            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <span>{passwordSuccess}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Current Password */}
                            <div>
                                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        id="oldPassword"
                                        name="oldPassword"
                                        value={passwordData.oldPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Enter your current password"
                                        className="pl-10 pr-10 py-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                    >
                                        {showOldPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Create a new password"
                                        className="pl-10 pr-10 py-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Confirm your new password"
                                        className="pl-10 pr-10 py-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Password Requirements</h3>
                                <ul className="space-y-1 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${validations.minLength ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={validations.minLength ? 'text-green-600' : 'text-gray-500'}>
                                            At least 8 characters
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${validations.hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={validations.hasUppercase ? 'text-green-600' : 'text-gray-500'}>
                                            At least one uppercase letter
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${validations.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={validations.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                                            At least one number
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${validations.hasSpecial ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={validations.hasSpecial ? 'text-green-600' : 'text-gray-500'}>
                                            At least one special character
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${validations.matching ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={validations.matching ? 'text-green-600' : 'text-gray-500'}>
                                            Passwords match
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={passwordMutation.isPending}
                                    className={`w-full flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors ${passwordMutation.isPending ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {passwordMutation.isPending ? (
                                        <>
                                            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                            <span>Changing Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            <span>Update Password</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GuestChangePassword;