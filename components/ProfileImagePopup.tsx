"use client";

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import React from 'react';

interface ProfileImagePopupProps {
    imageUrl: string;
    username: string;
    isOpen: boolean;
    onClose: () => void;
}

const ProfileImagePopup = ({ imageUrl, username, isOpen, onClose }: ProfileImagePopupProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div className="absolute top-2 right-2 z-10">
                        <button
                            onClick={onClose}
                            className="bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                            title="Close"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <img
                        src={imageUrl}
                        alt={`${username}'s profile picture`}
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-xl"
                    />
                    <div className="bg-black/50 text-white py-2 px-4 rounded-lg mt-2 shadow-lg">
                        <h3 className="text-lg font-semibold">{username}</h3>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileImagePopup; 