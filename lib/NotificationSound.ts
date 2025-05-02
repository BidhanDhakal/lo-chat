import { Howl } from 'howler';

// Singleton pattern for notification sound service
class NotificationSoundService {
    private static instance: NotificationSoundService;
    private messageSound: Howl;
    private requestSound: Howl;
    private isMuted: boolean = false;

    // Private constructor for singleton pattern
    private constructor() {
        // Initialize message notification sound
        this.messageSound = new Howl({
            src: ['/notification.mp3'],
            volume: 0.5,
            preload: true,
            html5: true // This helps with mobile playback
        });

        // Initialize friend request notification sound
        this.requestSound = new Howl({
            src: ['/notification.mp3'],
            volume: 0.5,
            preload: true,
            html5: true
        });
    }

    // Get the singleton instance
    public static getInstance(): NotificationSoundService {
        if (!NotificationSoundService.instance) {
            NotificationSoundService.instance = new NotificationSoundService();
        }
        return NotificationSoundService.instance;
    }

    // Play message notification sound
    public playMessageSound(): void {
        if (!this.isMuted) {
            this.messageSound.play();
        }
    }

    // Play friend request notification sound
    public playRequestSound(): void {
        if (!this.isMuted) {
            this.requestSound.play();
        }
    }

    // Mute all notification sounds
    public mute(): void {
        this.isMuted = true;
    }

    // Unmute notification sounds
    public unmute(): void {
        this.isMuted = false;
    }

    // Toggle mute state
    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // Check if sounds are muted
    public isSoundMuted(): boolean {
        return this.isMuted;
    }
}

// Export a singleton instance
const notificationSound = NotificationSoundService.getInstance();
export default notificationSound; 