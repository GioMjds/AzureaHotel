import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { IdCard } from 'lucide-react';
import { FC, memo, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { approveValidId, rejectValidId } from '../../services/Admin';
import { IUserFormModalProps } from '../../types/UsersAdmin';
import { getValidIdLabel } from '../../utils/booking';

const EditUserModal: FC<IUserFormModalProps> = ({ isOpen, cancel, userData, loading }) => {
    const [reason, setReason] = useState<string>("");
    const [showReasonField, setShowReasonField] = useState<boolean>(false);
    const [isSeniorOrPwd, setIsSeniorOrPwd] = useState<boolean>(userData?.is_senior_or_pwd || false);

    const queryClient = useQueryClient();

    useEffect(() => {
        setReason("");
        setShowReasonField(false);
        setIsSeniorOrPwd(userData?.is_senior_or_pwd || false);
    }, [isOpen, userData])

    const approveMutation = useMutation({
        mutationFn: () => approveValidId(userData!.id, isSeniorOrPwd),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(res.message);
            cancel();
        },
        onError: () => toast.error('Failed to approve ID'),
    });

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => rejectValidId(userData!.id, reason),
        onSuccess: (res) => {
            toast.info(res.message);
            cancel();
        },
        onError: () => toast.error('Failed to reject ID'),
    });

    const handleRejectSubmit = () => {
        if (reason.trim()) rejectMutation.mutate(reason.trim());
        else toast.error('Rejection reason cannot be empty');
    }

    const handleApprove = () => {
        console.log('[EditUserModal] Approve clicked. isSeniorOrPwd:', isSeniorOrPwd);
        approveMutation.mutate();
    };

    if (!isOpen || !userData) return null;

    return (
        <AnimatePresence>
            <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl mx-4"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>

                    <h2 className="text-2xl font-bold mb-4">Guest ID Verification</h2>

                    <div className="flex items-center space-x-2 mb-4">
                        <IdCard className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-medium">{getValidIdLabel(userData.valid_id_type)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {userData.valid_id_front && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-2"
                            >
                                <span className="text-sm font-medium text-gray-700">Front Side</span>
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                    <img
                                        src={userData.valid_id_front}
                                        alt="ID Front"
                                        className="w-full h-full object-contain p-2"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {userData.valid_id_back && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-2"
                            >
                                <span className="text-sm font-medium text-gray-700">Back Side</span>
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                    <img
                                        src={userData.valid_id_back}
                                        alt="ID Back"
                                        className="w-full h-full object-contain p-2"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* PWD/Senior Discount Checkbox */}
                    <div className="mb-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="seniorOrPwd"
                            checked={isSeniorOrPwd}
                            onChange={e => setIsSeniorOrPwd(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-purple-600"
                        />
                        <label htmlFor="seniorOrPwd" className="text-md font-medium text-gray-700">
                            Apply PWD / Senior Discount (20% off all bookings)
                        </label>
                    </div>

                    {/* Rejection Reason Field (conditional) */}
                    {showReasonField && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason
                            </label>
                            <textarea
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full border rounded-md p-2 resize-none"
                                placeholder="Enter reason for rejecting this ID"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button onClick={cancel} className="px-5 py-2 bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 cursor-pointer transition-colors duration-300">Cancel</button>

                        <button
                            onClick={handleApprove}
                            disabled={approveMutation.isPending || loading}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors duration-300 cursor-pointer"
                        >
                            {approveMutation.isPending || loading ? 'Approving...' : 'Approve'}
                        </button>

                        {!showReasonField ? (
                            <button
                                onClick={() => setShowReasonField(true)}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg cursor-pointer"
                            >
                                Reject
                            </button>
                        ) : (
                            <button
                                onClick={handleRejectSubmit}
                                disabled={rejectMutation.isPending}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                            >
                                {rejectMutation.isPending ? 'Rejecting...' : 'Submit Rejection'}
                            </button>
                        )}
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default memo(EditUserModal);